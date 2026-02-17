import { Router } from 'express';
import servicePaiement from '../services/servicePaiement.js';
import { Paiement } from '../modeles/index.js';
import { autoriserRôles, RÔLES } from '../../../../partagé/middlewares/authentification.js';
import { répondreSuccès, répondreCréé, répondrePaginé, extrairePagination } from '../../../../partagé/utilitaires/réponses.js';
import { ErreurIntrouvable } from '../../../../partagé/middlewares/gestionErreurs.js';

const routeur = Router();

// GET /api/paiements - Historique des paiements
routeur.get('/', async (req, res, next) => {
  try {
    const { page, limite, décalage } = extrairePagination(req.query);
    const { statut, canal, contribuableId } = req.query;

    const oùClause = {};
    if (statut) oùClause.statut = statut;
    if (canal) oùClause.canal = canal;
    if (contribuableId) oùClause.contribuableId = contribuableId;

    // Les citoyens ne voient que leurs propres paiements
    if (req.utilisateur.rôle === RÔLES.CITOYEN) {
      oùClause.contribuableId = req.utilisateur.id;
    }

    const { count, rows } = await Paiement.findAndCountAll({
      where: oùClause,
      limit: limite,
      offset: décalage,
      order: [['date_initiation', 'DESC']],
    });

    return répondrePaginé(res, rows, { page, limite, total: count });
  } catch (erreur) { next(erreur); }
});

// GET /api/paiements/:id
routeur.get('/:id', async (req, res, next) => {
  try {
    const paiement = await Paiement.findByPk(req.params.id);
    if (!paiement) throw new ErreurIntrouvable('Paiement');
    return répondreSuccès(res, paiement);
  } catch (erreur) { next(erreur); }
});

// POST /api/paiements/mobile-money
routeur.post('/mobile-money', async (req, res, next) => {
  try {
    const paiement = await servicePaiement.initierPaiementMobileMoney({
      ...req.body,
      contribuableId: req.utilisateur.rôle === RÔLES.CITOYEN
        ? req.utilisateur.id
        : req.body.contribuableId,
    });
    return répondreCréé(res, paiement, 'Paiement Mobile Money initié');
  } catch (erreur) { next(erreur); }
});

// POST /api/paiements/guichet (agents seulement)
routeur.post('/guichet',
  autoriserRôles(RÔLES.AGENT_FINANCIER, RÔLES.AGENT_RÉGIE, RÔLES.ADMIN_SYSTÈME),
  async (req, res, next) => {
    try {
      const résultat = await servicePaiement.enregistrerPaiementGuichet(
        { ...req.body, agentId: req.utilisateur.id },
        req.utilisateur
      );
      return répondreCréé(res, résultat, 'Paiement guichet enregistré et quittance émise');
    } catch (erreur) { next(erreur); }
  }
);

// PATCH /api/paiements/:id/confirmer (admin / trésor seulement)
routeur.patch('/:id/confirmer',
  autoriserRôles(RÔLES.ADMIN_SYSTÈME, RÔLES.AGENT_FINANCIER, RÔLES.TRÉSOR_PUBLIC),
  async (req, res, next) => {
    try {
      const résultat = await servicePaiement.confirmerPaiement(req.params.id, req.body.transactionIdExterne);
      return répondreSuccès(res, résultat, 'Paiement confirmé et quittance émise');
    } catch (erreur) { next(erreur); }
  }
);

export default routeur;
