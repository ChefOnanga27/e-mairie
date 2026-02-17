import { Router } from 'express';
import crypto from 'crypto';
import { Paiement } from '../modeles/index.js';
import servicePaiement from '../services/servicePaiement.js';
import { journaliser } from '../../../../partagé/utilitaires/journalisation.js';

const routeur = Router();

// Vérification de la signature HMAC du webhook
const vérifierSignatureWebhook = (req, res, next) => {
  const signature = req.headers['x-mobilemoney-signature'];
  const corps = JSON.stringify(req.body);

  const signatureCalculée = crypto
    .createHmac('sha256', process.env.MOBILE_MONEY_SECRET)
    .update(corps)
    .digest('hex');

  if (signature !== signatureCalculée) {
    journaliser.warn('⚠️  Webhook reçu avec signature invalide');
    return res.status(401).json({ succès: false, message: 'Signature webhook invalide' });
  }

  next();
};

// POST /api/webhooks/mobile-money - Confirmation de paiement par l'opérateur
routeur.post('/mobile-money', express.json(), vérifierSignatureWebhook, async (req, res, next) => {
  try {
    const { transactionId, référence, statut, montant } = req.body;

    journaliser.info(`📲 Webhook Mobile Money reçu - Référence: ${référence}, Statut: ${statut}`);

    const paiement = await Paiement.findOne({ where: { référencePaiement: référence } });

    if (!paiement) {
      journaliser.warn(`Webhook: paiement introuvable pour la référence ${référence}`);
      return res.status(200).json({ reçu: true }); // Toujours 200 pour éviter les renvois
    }

    if (statut === 'succès' && paiement.statut !== 'validé') {
      await servicePaiement.confirmerPaiement(paiement.id, transactionId);
      journaliser.info(`✅ Paiement ${référence} confirmé automatiquement via webhook`);
    } else if (statut === 'échec') {
      await paiement.update({ statut: 'rejeté', motifRejet: req.body.motif || 'Échec opérateur' });
    }

    return res.status(200).json({ reçu: true });
  } catch (erreur) {
    journaliser.error('Erreur traitement webhook:', erreur);
    return res.status(200).json({ reçu: true }); // Toujours 200 pour éviter les renvois infinis
  }
});

import express from 'express';
export default routeur;
