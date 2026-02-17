import { Router } from 'express';
import { TypeTaxe } from '../modeles/index.js';
import { autoriserRôles, RÔLES } from '../../../../partagé/middlewares/authentification.js';
import { répondreSuccès, répondreCréé, répondreErreur, répondrePaginé, extrairePagination } from '../../../../partagé/utilitaires/réponses.js';
import { ErreurIntrouvable } from '../../../../partagé/middlewares/gestionErreurs.js';

const routeur = Router();

// GET /api/types-taxes
routeur.get('/', async (req, res, next) => {
  try {
    const { page, limite, décalage } = extrairePagination(req.query);
    const { catégorie, estActif } = req.query;

    const oùClause = {};
    if (catégorie) oùClause.catégorie = catégorie;
    if (estActif !== undefined) oùClause.estActif = estActif === 'true';

    const { count, rows } = await TypeTaxe.findAndCountAll({
      where: oùClause,
      limit: limite,
      offset: décalage,
      order: [['catégorie', 'ASC'], ['libellé', 'ASC']],
    });

    return répondrePaginé(res, rows, { page, limite, total: count });
  } catch (erreur) { next(erreur); }
});

// GET /api/types-taxes/:id
routeur.get('/:id', async (req, res, next) => {
  try {
    const taxe = await TypeTaxe.findByPk(req.params.id);
    if (!taxe) throw new ErreurIntrouvable('Type de taxe');
    return répondreSuccès(res, taxe);
  } catch (erreur) { next(erreur); }
});

// POST /api/types-taxes (admin seulement)
routeur.post('/',
  autoriserRôles(RÔLES.ADMIN_SYSTÈME, RÔLES.MAIRIE_EXÉCUTIF),
  async (req, res, next) => {
    try {
      const taxe = await TypeTaxe.create({ ...req.body, créePar: req.utilisateur.id });
      return répondreCréé(res, taxe, 'Type de taxe créé');
    } catch (erreur) { next(erreur); }
  }
);

// PUT /api/types-taxes/:id
routeur.put('/:id',
  autoriserRôles(RÔLES.ADMIN_SYSTÈME, RÔLES.MAIRIE_EXÉCUTIF),
  async (req, res, next) => {
    try {
      const taxe = await TypeTaxe.findByPk(req.params.id);
      if (!taxe) throw new ErreurIntrouvable('Type de taxe');
      await taxe.update(req.body);
      return répondreSuccès(res, taxe, 'Type de taxe mis à jour');
    } catch (erreur) { next(erreur); }
  }
);

export default routeur;
