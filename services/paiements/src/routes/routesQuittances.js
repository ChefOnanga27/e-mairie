import { Router } from 'express';
import { Quittance, Paiement } from '../modeles/index.js';
import servicePaiement from '../services/servicePaiement.js';
import { répondreSuccès } from '../../../../partagé/utilitaires/réponses.js';
import { ErreurIntrouvable, ErreurApplication } from '../../../../partagé/middlewares/gestionErreurs.js';

const routeur = Router();

// GET /api/quittances/:numéro - Récupérer une quittance par son numéro
routeur.get('/:numéro', async (req, res, next) => {
  try {
    const quittance = await Quittance.findOne({
      where: { numéroQuittance: req.params.numéro },
      include: [{ model: Paiement, as: 'paiement' }],
    });
    if (!quittance) throw new ErreurIntrouvable('Quittance');
    return répondreSuccès(res, quittance);
  } catch (erreur) { next(erreur); }
});

// GET /api/quittances/vérifier/:code - Vérifier l'authenticité d'une quittance
routeur.get('/vérifier/:code', async (req, res, next) => {
  try {
    const quittance = await Quittance.findOne({
      where: { codeVérification: req.params.code, estValide: true },
    });

    if (!quittance) {
      return répondreSuccès(res, { authentique: false }, 'Quittance non trouvée ou invalide');
    }

    return répondreSuccès(res, {
      authentique: true,
      numéroQuittance: quittance.numéroQuittance,
      montant: quittance.montantPayé,
      dateÉmission: quittance.dateÉmission,
    }, 'Quittance authentique');
  } catch (erreur) { next(erreur); }
});

export default routeur;
