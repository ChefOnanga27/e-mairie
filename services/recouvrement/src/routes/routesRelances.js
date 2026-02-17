import { Router } from 'express';
import { Relance } from '../modeles/index.js';
import serviceRelance from '../services/serviceRelance.js';
import { autoriserRôles, RÔLES } from '../../../../partagé/middlewares/authentification.js';
import { répondreSuccès, répondreCréé, répondrePaginé, extrairePagination } from '../../../../partagé/utilitaires/réponses.js';

export const routeurRelances = Router();
export const routeurInjonctions = Router();

// ─── RELANCES ──────────────────────────────────────────────────────────────

// GET /api/relances
routeurRelances.get('/', async (req, res, next) => {
  try {
    const { page, limite, décalage } = extrairePagination(req.query);
    const { factureId, type, statut } = req.query;

    const oùClause = {};
    if (factureId) oùClause.factureId = factureId;
    if (type) oùClause.type = type;
    if (statut) oùClause.statut = statut;

    const { count, rows } = await Relance.findAndCountAll({
      where: oùClause,
      limit: limite,
      offset: décalage,
      order: [['created_at', 'DESC']],
    });

    return répondrePaginé(res, rows, { page, limite, total: count });
  } catch (erreur) { next(erreur); }
});

// POST /api/relances/manuelle - Envoyer une relance manuelle
routeurRelances.post('/manuelle',
  autoriserRôles(RÔLES.AGENT_FINANCIER, RÔLES.AGENT_RÉGIE, RÔLES.ADMIN_SYSTÈME),
  async (req, res, next) => {
    try {
      const { factureId, contribuableId, type, message, destinataire } = req.body;

      const relance = await Relance.create({
        factureId, contribuableId, type,
        numéro: 1,
        message: message || 'Relance manuelle',
        destinataire,
        envoyéePar: 'agent',
        agentId: req.utilisateur.id,
        statut: 'en_cours',
      });

      return répondreCréé(res, relance, 'Relance manuelle créée');
    } catch (erreur) { next(erreur); }
  }
);

// POST /api/relances/déclencher-automatiques (admin seulement)
routeurRelances.post('/déclencher-automatiques',
  autoriserRôles(RÔLES.ADMIN_SYSTÈME),
  async (req, res, next) => {
    try {
      const résultat = await serviceRelance.envoyerRelancesAutomatiques();
      return répondreSuccès(res, résultat, 'Relances automatiques déclenchées');
    } catch (erreur) { next(erreur); }
  }
);

// ─── INJONCTIONS ───────────────────────────────────────────────────────────

import { Injonction } from '../modeles/index.js';
import { ErreurIntrouvable } from '../../../../partagé/middlewares/gestionErreurs.js';

// GET /api/injonctions
routeurInjonctions.get('/',
  autoriserRôles(RÔLES.ADMIN_SYSTÈME, RÔLES.MAIRIE_EXÉCUTIF, RÔLES.JUSTICE, RÔLES.AGENT_FINANCIER),
  async (req, res, next) => {
    try {
      const { page, limite, décalage } = extrairePagination(req.query);
      const { count, rows } = await Injonction.findAndCountAll({
        limit: limite, offset: décalage, order: [['created_at', 'DESC']],
      });
      return répondrePaginé(res, rows, { page, limite, total: count });
    } catch (erreur) { next(erreur); }
  }
);

// POST /api/injonctions - Créer une injonction de payer
routeurInjonctions.post('/',
  autoriserRôles(RÔLES.ADMIN_SYSTÈME, RÔLES.MAIRIE_EXÉCUTIF, RÔLES.AGENT_FINANCIER),
  async (req, res, next) => {
    try {
      const compte = await Injonction.count();
      const numéroInjonction = `INJ-${new Date().getFullYear()}-${String(compte + 1).padStart(5, '0')}`;

      const injonction = await Injonction.create({
        ...req.body,
        numéroInjonction,
        créePar: req.utilisateur.id,
      });

      return répondreCréé(res, injonction, `Injonction ${numéroInjonction} créée`);
    } catch (erreur) { next(erreur); }
  }
);

// PATCH /api/injonctions/:id/statut
routeurInjonctions.patch('/:id/statut',
  autoriserRôles(RÔLES.ADMIN_SYSTÈME, RÔLES.JUSTICE, RÔLES.MAIRIE_EXÉCUTIF),
  async (req, res, next) => {
    try {
      const injonction = await Injonction.findByPk(req.params.id);
      if (!injonction) throw new ErreurIntrouvable('Injonction');
      await injonction.update({ statut: req.body.statut, notes: req.body.notes });
      return répondreSuccès(res, injonction, 'Statut de l\'injonction mis à jour');
    } catch (erreur) { next(erreur); }
  }
);
