import { Router } from 'express';
import { Utilisateur } from '../modeles/index.js';
import { vérifierToken, autoriserRôles, RÔLES } from '../../../../partagé/middlewares/authentification.js';
import { répondreSuccès, répondrePaginé, extrairePagination } from '../../../../partagé/utilitaires/réponses.js';
import { ErreurIntrouvable } from '../../../../partagé/middlewares/gestionErreurs.js';

const routeur = Router();

// Tous les endpoints nécessitent une authentification
routeur.use(vérifierToken);

// GET /api/utilisateurs - Lister tous les utilisateurs (admin seulement)
routeur.get('/',
  autoriserRôles(RÔLES.ADMIN_SYSTÈME, RÔLES.MAIRIE_EXÉCUTIF),
  async (req, res, next) => {
    try {
      const { page, limite, décalage } = extrairePagination(req.query);

      const { count, rows } = await Utilisateur.findAndCountAll({
        limit: limite,
        offset: décalage,
        order: [['created_at', 'DESC']],
      });

      return répondrePaginé(res, rows, { page, limite, total: count });
    } catch (erreur) {
      next(erreur);
    }
  }
);

// GET /api/utilisateurs/:id - Obtenir un utilisateur
routeur.get('/:id', async (req, res, next) => {
  try {
    const utilisateur = await Utilisateur.findByPk(req.params.id);
    if (!utilisateur) throw new ErreurIntrouvable('Utilisateur');

    return répondreSuccès(res, utilisateur);
  } catch (erreur) {
    next(erreur);
  }
});

// PUT /api/utilisateurs/:id/statut - Activer/désactiver un utilisateur
routeur.put('/:id/statut',
  autoriserRôles(RÔLES.ADMIN_SYSTÈME),
  async (req, res, next) => {
    try {
      const utilisateur = await Utilisateur.findByPk(req.params.id);
      if (!utilisateur) throw new ErreurIntrouvable('Utilisateur');

      await utilisateur.update({ estActif: req.body.estActif });
      return répondreSuccès(res, utilisateur, `Utilisateur ${req.body.estActif ? 'activé' : 'désactivé'}`);
    } catch (erreur) {
      next(erreur);
    }
  }
);

export default routeur;
