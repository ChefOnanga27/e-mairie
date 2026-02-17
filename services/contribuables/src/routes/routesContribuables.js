import { Router } from 'express';
import { Op } from 'sequelize';
import { Contribuable } from '../modeles/index.js';
import { autoriserRôles, RÔLES } from '../../../../partagé/middlewares/authentification.js';
import {
  répondreSuccès,
  répondreCréé,
  répondrePaginé,
  extrairePagination,
} from '../../../../partagé/utilitaires/réponses.js';
import { ErreurIntrouvable, ErreurValidation } from '../../../../partagé/middlewares/gestionErreurs.js';
import { journaliserAudit } from '../../../../partagé/utilitaires/journalisation.js';

const routeur = Router();

// ─── GET /api/contribuables ────────────────────────────────────────────────
// Lister tous les contribuables avec pagination et recherche
routeur.get('/', async (req, res, next) => {
  try {
    const { page, limite, décalage } = extrairePagination(req.query);
    const { recherche, catégorie, commune, estActif } = req.query;

    // Construction des filtres dynamiques
    const oùClause = {};

    if (recherche) {
      oùClause[Op.or] = [
        { nom: { [Op.iLike]: `%${recherche}%` } },
        { prénom: { [Op.iLike]: `%${recherche}%` } },
        { raisonSociale: { [Op.iLike]: `%${recherche}%` } },
        { numéroIdentifiant: { [Op.iLike]: `%${recherche}%` } },
        { téléphone: { [Op.iLike]: `%${recherche}%` } },
      ];
    }

    if (catégorie) oùClause.catégorie = catégorie;
    if (commune) oùClause.commune = { [Op.iLike]: `%${commune}%` };
    if (estActif !== undefined) oùClause.estActif = estActif === 'true';

    const { count, rows } = await Contribuable.findAndCountAll({
      where: oùClause,
      limit: limite,
      offset: décalage,
      order: [['created_at', 'DESC']],
    });

    return répondrePaginé(res, rows, { page, limite, total: count }, 'Contribuables récupérés');
  } catch (erreur) {
    next(erreur);
  }
});

// ─── GET /api/contribuables/:id ────────────────────────────────────────────
routeur.get('/:id', async (req, res, next) => {
  try {
    const contribuable = await Contribuable.findByPk(req.params.id);
    if (!contribuable) throw new ErreurIntrouvable('Contribuable');
    return répondreSuccès(res, contribuable, 'Contribuable récupéré');
  } catch (erreur) {
    next(erreur);
  }
});

// ─── GET /api/contribuables/identifiant/:num ───────────────────────────────
// Recherche par NIF ou identifiant communal
routeur.get('/identifiant/:numéro', async (req, res, next) => {
  try {
    const contribuable = await Contribuable.findOne({
      where: { numéroIdentifiant: req.params.numéro },
    });
    if (!contribuable) throw new ErreurIntrouvable('Contribuable');
    return répondreSuccès(res, contribuable);
  } catch (erreur) {
    next(erreur);
  }
});

// ─── POST /api/contribuables ───────────────────────────────────────────────
routeur.post('/',
  autoriserRôles(RÔLES.ADMIN_SYSTÈME, RÔLES.AGENT_FINANCIER, RÔLES.AGENT_RÉGIE),
  async (req, res, next) => {
    try {
      const données = { ...req.body, créePar: req.utilisateur.id };
      const contribuable = await Contribuable.create(données);

      journaliserAudit('créer_contribuable', req.utilisateur, { contribuableId: contribuable.id });

      return répondreCréé(res, contribuable, 'Contribuable créé avec succès');
    } catch (erreur) {
      next(erreur);
    }
  }
);

// ─── PUT /api/contribuables/:id ────────────────────────────────────────────
routeur.put('/:id',
  autoriserRôles(RÔLES.ADMIN_SYSTÈME, RÔLES.AGENT_FINANCIER, RÔLES.AGENT_RÉGIE),
  async (req, res, next) => {
    try {
      const contribuable = await Contribuable.findByPk(req.params.id);
      if (!contribuable) throw new ErreurIntrouvable('Contribuable');

      const anciennesValeurs = contribuable.toJSON();
      await contribuable.update(req.body);

      journaliserAudit('modifier_contribuable', req.utilisateur, {
        contribuableId: contribuable.id,
        anciennesValeurs,
        nouvellesValeurs: req.body,
      });

      return répondreSuccès(res, contribuable, 'Contribuable mis à jour');
    } catch (erreur) {
      next(erreur);
    }
  }
);

// ─── DELETE /api/contribuables/:id ────────────────────────────────────────
routeur.delete('/:id',
  autoriserRôles(RÔLES.ADMIN_SYSTÈME),
  async (req, res, next) => {
    try {
      const contribuable = await Contribuable.findByPk(req.params.id);
      if (!contribuable) throw new ErreurIntrouvable('Contribuable');

      await contribuable.destroy(); // Soft delete (paranoid: true)

      journaliserAudit('supprimer_contribuable', req.utilisateur, { contribuableId: req.params.id });

      return répondreSuccès(res, null, 'Contribuable archivé avec succès');
    } catch (erreur) {
      next(erreur);
    }
  }
);

export default routeur;
