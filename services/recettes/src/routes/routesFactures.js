import { Router } from 'express';
import { Op } from 'sequelize';
import { Facture, TypeTaxe } from '../modeles/index.js';
import { autoriserRôles, RÔLES } from '../../../../partagé/middlewares/authentification.js';
import {
  répondreSuccès, répondreCréé, répondrePaginé, extrairePagination,
} from '../../../../partagé/utilitaires/réponses.js';
import { ErreurIntrouvable, ErreurApplication } from '../../../../partagé/middlewares/gestionErreurs.js';
import { journaliserAudit } from '../../../../partagé/utilitaires/journalisation.js';

const routeur = Router();

// Générateur de numéro de facture unique
const générerNuméroFacture = async () => {
  const année = new Date().getFullYear();
  const mois = String(new Date().getMonth() + 1).padStart(2, '0');
  const compte = await Facture.count();
  const séquence = String(compte + 1).padStart(6, '0');
  return `FACT-${année}${mois}-${séquence}`;
};

// GET /api/factures - Liste avec filtres avancés
routeur.get('/', async (req, res, next) => {
  try {
    const { page, limite, décalage } = extrairePagination(req.query);
    const { statut, contribuableId, typeTaxeId, dateDebut, dateFin } = req.query;

    const oùClause = {};
    if (statut) oùClause.statut = statut;
    if (contribuableId) oùClause.contribuableId = contribuableId;
    if (typeTaxeId) oùClause.typeTaxeId = typeTaxeId;

    if (dateDebut || dateFin) {
      oùClause.dateÉchéance = {};
      if (dateDebut) oùClause.dateÉchéance[Op.gte] = dateDebut;
      if (dateFin) oùClause.dateÉchéance[Op.lte] = dateFin;
    }

    const { count, rows } = await Facture.findAndCountAll({
      where: oùClause,
      include: [{ model: TypeTaxe, as: 'typeTaxe', attributes: ['libellé', 'catégorie'] }],
      limit: limite,
      offset: décalage,
      order: [['date_échéance', 'ASC']],
    });

    return répondrePaginé(res, rows, { page, limite, total: count });
  } catch (erreur) { next(erreur); }
});

// GET /api/factures/contribuable/:id - Factures d'un contribuable
routeur.get('/contribuable/:contribuableId', async (req, res, next) => {
  try {
    const factures = await Facture.findAll({
      where: { contribuableId: req.params.contribuableId },
      include: [{ model: TypeTaxe, as: 'typeTaxe' }],
      order: [['date_échéance', 'ASC']],
    });
    return répondreSuccès(res, factures, `${factures.length} facture(s) trouvée(s)`);
  } catch (erreur) { next(erreur); }
});

// GET /api/factures/:id
routeur.get('/:id', async (req, res, next) => {
  try {
    const facture = await Facture.findByPk(req.params.id, {
      include: [{ model: TypeTaxe, as: 'typeTaxe' }],
    });
    if (!facture) throw new ErreurIntrouvable('Facture');

    // Calculer le montant actualisé avec pénalités
    const montantDû = facture.calculerMontantDû();
    return répondreSuccès(res, { ...facture.toJSON(), montantActualiséDû: montantDû });
  } catch (erreur) { next(erreur); }
});

// POST /api/factures - Émettre une nouvelle facture
routeur.post('/',
  autoriserRôles(RÔLES.ADMIN_SYSTÈME, RÔLES.AGENT_FINANCIER, RÔLES.AGENT_RÉGIE),
  async (req, res, next) => {
    try {
      const typeTaxe = await TypeTaxe.findByPk(req.body.typeTaxeId);
      if (!typeTaxe) throw new ErreurIntrouvable('Type de taxe');
      if (!typeTaxe.estActif) throw new ErreurApplication('Ce type de taxe est désactivé', 400);

      const numéroFacture = await générerNuméroFacture();
      const montantInitial = parseFloat(req.body.montantInitial) || typeTaxe.montantBase;

      const facture = await Facture.create({
        ...req.body,
        numéroFacture,
        montantInitial,
        montantTotal: montantInitial,
        tauxPénalité: typeTaxe.tauxPénalité,
        créePar: req.utilisateur.id,
      });

      journaliserAudit('émettre_facture', req.utilisateur, { factureId: facture.id, numéroFacture });

      return répondreCréé(res, facture, `Facture ${numéroFacture} émise`);
    } catch (erreur) { next(erreur); }
  }
);

// POST /api/factures/lot - Émission en lot
routeur.post('/lot',
  autoriserRôles(RÔLES.ADMIN_SYSTÈME, RÔLES.AGENT_FINANCIER),
  async (req, res, next) => {
    try {
      const { contribuableIds, typeTaxeId, période, dateÉchéance } = req.body;
      const typeTaxe = await TypeTaxe.findByPk(typeTaxeId);
      if (!typeTaxe) throw new ErreurIntrouvable('Type de taxe');

      const facturesCreated = [];
      for (const contribuableId of contribuableIds) {
        const numéroFacture = await générerNuméroFacture();
        const facture = await Facture.create({
          numéroFacture,
          contribuableId,
          typeTaxeId,
          période,
          dateÉchéance,
          montantInitial: typeTaxe.montantBase,
          montantTotal: typeTaxe.montantBase,
          tauxPénalité: typeTaxe.tauxPénalité,
          créePar: req.utilisateur.id,
        });
        facturesCreated.push(facture.numéroFacture);
      }

      journaliserAudit('émission_lot_factures', req.utilisateur, {
        nombre: facturesCreated.length, typeTaxeId, période,
      });

      return répondreCréé(res, { factures: facturesCreated, nombre: facturesCreated.length }, 'Émission en lot réussie');
    } catch (erreur) { next(erreur); }
  }
);

export default routeur;
