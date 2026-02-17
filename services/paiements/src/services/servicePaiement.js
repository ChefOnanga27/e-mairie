import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { Paiement, Quittance } from '../modeles/index.js';
import { ErreurApplication } from '../../../../partagé/middlewares/gestionErreurs.js';
import { journaliserAudit } from '../../../../partagé/utilitaires/journalisation.js';

class ServicePaiement {

  // Générer une référence de paiement unique
  _générerRéférence() {
    const horodatage = Date.now().toString(36).toUpperCase();
    const aléatoire = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PAY-${horodatage}-${aléatoire}`;
  }

  // Générer le numéro de quittance
  async _générerNuméroQuittance() {
    const année = new Date().getFullYear();
    const compte = await Quittance.count();
    return `QUIT-${année}-${String(compte + 1).padStart(7, '0')}`;
  }

  // Générer un code de vérification court
  _générerCodeVérification() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  // Traiter un paiement via Mobile Money
  async initierPaiementMobileMoney({ factureId, contribuableId, montant, numéroMobileMoney, opérateur }) {
    const référencePaiement = this._générerRéférence();

    // Appel à l'API Mobile Money externe
    let transactionIdExterne = null;
    let statut = 'en_attente_confirmation';

    try {
      const réponseMM = await axios.post(
        `${process.env.MOBILE_MONEY_API_URL}/initier`,
        {
          montant,
          numéro: numéroMobileMoney,
          référence: référencePaiement,
          description: `Paiement facture municipale ${factureId}`,
        },
        {
          headers: { Authorization: `Bearer ${process.env.MOBILE_MONEY_CLE_API}` },
          timeout: 15000,
        }
      );

      transactionIdExterne = réponseMM.data?.transactionId;
      statut = réponseMM.data?.statut === 'initié' ? 'en_attente_confirmation' : 'rejeté';
    } catch (erreurMM) {
      statut = 'rejeté';
    }

    const paiement = await Paiement.create({
      référencePaiement,
      factureId,
      contribuableId,
      montant,
      canal: 'mobile_money',
      statut,
      numéroMobileMoney,
      opérateur,
      transactionIdExterne,
      dateInitiation: new Date(),
    });

    return paiement;
  }

  // Enregistrer un paiement au guichet
  async enregistrerPaiementGuichet({ factureId, contribuableId, montant, agentId, pointEncaissement }, utilisateur) {
    const référencePaiement = this._générerRéférence();

    const paiement = await Paiement.create({
      référencePaiement,
      factureId,
      contribuableId,
      montant,
      canal: 'guichet',
      statut: 'validé',
      agentId,
      pointEncaissement,
      dateInitiation: new Date(),
      dateConfirmation: new Date(),
    });

    journaliserAudit('paiement_guichet', utilisateur, {
      paiementId: paiement.id,
      montant,
      factureId,
    });

    // Émettre automatiquement la quittance
    const quittance = await this.émettrequittance(paiement.id, utilisateur);
    return { paiement, quittance };
  }

  // Confirmer un paiement (via webhook ou manuellement)
  async confirmerPaiement(paiementId, transactionIdExterne = null) {
    const paiement = await Paiement.findByPk(paiementId);
    if (!paiement) throw new ErreurApplication('Paiement introuvable', 404);

    await paiement.update({
      statut: 'validé',
      dateConfirmation: new Date(),
      ...(transactionIdExterne && { transactionIdExterne }),
    });

    // Émettre la quittance automatiquement
    const quittance = await this.émettrequittance(paiementId, null);

    // Notifier le service recettes de mettre à jour la facture
    await this._notifierServiceRecettes(paiement.factureId, paiement.montant);

    return { paiement, quittance };
  }

  // Émettre une quittance numérique infalsifiable
  async émettrequittance(paiementId, utilisateur) {
    const paiement = await Paiement.findByPk(paiementId);
    if (!paiement) throw new ErreurApplication('Paiement introuvable', 404);

    const numéroQuittance = await this._générerNuméroQuittance();
    const codeVérification = this._générerCodeVérification();

    // Données de la quittance pour le QR code
    const donnéesQR = {
      numéroQuittance,
      factureId: paiement.factureId,
      montant: paiement.montant,
      date: new Date().toISOString(),
      codeVérification,
    };

    const codeQR = await QRCode.toString(JSON.stringify(donnéesQR), { type: 'svg' });

    // Signature numérique (hash SHA-256)
    const signatureNumérique = crypto
      .createHmac('sha256', process.env.JWT_SECRET)
      .update(JSON.stringify(donnéesQR))
      .digest('hex');

    const quittance = await Quittance.create({
      numéroQuittance,
      paiementId,
      factureId: paiement.factureId,
      contribuableId: paiement.contribuableId,
      montantPayé: paiement.montant,
      codeQR,
      codeVérification,
      signatureNumérique,
      émisePar: utilisateur?.id || null,
    });

    return quittance;
  }

  // Notifier le service recettes de la mise à jour de statut facture
  async _notifierServiceRecettes(factureId, montantPayé) {
    try {
      await axios.patch(
        `http://localhost:${process.env.PORT_RECETTES}/api/factures/${factureId}/paiement`,
        { montantPayé },
        { headers: { 'X-Internal-Service': 'paiements' }, timeout: 5000 }
      );
    } catch (erreur) {
      console.error('⚠️  Impossible de notifier le service recettes:', erreur.message);
    }
  }
}

export default new ServicePaiement();
