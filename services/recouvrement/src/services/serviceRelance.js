import axios from 'axios';
import nodemailer from 'nodemailer';
import { Relance, Injonction } from '../modeles/index.js';
import { journaliser } from '../../../../partagé/utilitaires/journalisation.js';
import dotenv from 'dotenv';

dotenv.config();

// Configuration du transporteur email
const transporteurEmail = nodemailer.createTransport({
  host: process.env.SMTP_HOTE,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_UTILISATEUR,
    pass: process.env.SMTP_MOT_DE_PASSE,
  },
});

class ServiceRelance {

  // Envoyer les relances automatiques (appelé par CRON)
  async envoyerRelancesAutomatiques() {
    // Récupérer les factures impayées depuis le service recettes
    const facturesImpayées = await this._récupérerFacturesImpayées();
    let compteurEnvois = 0;

    for (const facture of facturesImpayées) {
      try {
        const contribuable = await this._récupérerContribuable(facture.contribuable_id);
        if (!contribuable) continue;

        // Déterminer le type de relance selon le nombre de relances précédentes
        const nombreRelancesPrécédentes = facture.nombre_relances || 0;

        if (nombreRelancesPrécédentes < 1 && contribuable.téléphone) {
          await this._envoyerSMS(facture, contribuable);
          compteurEnvois++;
        } else if (nombreRelancesPrécédentes < 2 && contribuable.email) {
          await this._envoyerEmail(facture, contribuable);
          compteurEnvois++;
        } else if (nombreRelancesPrécédentes < 3 && contribuable.téléphone) {
          await this._envoyerWhatsApp(facture, contribuable);
          compteurEnvois++;
        } else if (nombreRelancesPrécédentes >= 3) {
          // Signaler pour injonction judiciaire
          journaliser.warn(`📋 Facture ${facture.numéro_facture} - Prête pour injonction judiciaire`);
        }
      } catch (erreur) {
        journaliser.error(`Erreur relance facture ${facture.numéro_facture}:`, erreur.message);
      }
    }

    journaliser.info(`✅ ${compteurEnvois} relances envoyées`);
    return { relancesEnvoyées: compteurEnvois };
  }

  // Envoyer un SMS de relance via Twilio
  async _envoyerSMS(facture, contribuable) {
    const message = this._composerMessageRelance(facture, contribuable, 'sms');

    const relance = await Relance.create({
      factureId: facture.id,
      contribuableId: contribuable.id,
      type: 'sms',
      numéro: (facture.nombre_relances || 0) + 1,
      message,
      destinataire: contribuable.téléphone,
    });

    try {
      const { default: twilio } = await import('twilio');
      const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

      const réponse = await client.messages.create({
        body: message,
        from: process.env.TWILIO_NUMERO,
        to: contribuable.téléphone,
      });

      await relance.update({ statut: 'envoyée', réponseAPI: { sid: réponse.sid } });
    } catch (erreur) {
      await relance.update({ statut: 'échouée', erreur: erreur.message });
    }

    return relance;
  }

  // Envoyer un email de relance
  async _envoyerEmail(facture, contribuable) {
    const message = this._composerMessageRelance(facture, contribuable, 'email');
    const nomComplet = contribuable.catégorie === 'entreprise'
      ? contribuable.raisonSociale
      : `${contribuable.prénom} ${contribuable.nom}`;

    const relance = await Relance.create({
      factureId: facture.id,
      contribuableId: contribuable.id,
      type: 'email',
      numéro: (facture.nombre_relances || 0) + 1,
      message,
      destinataire: contribuable.email,
    });

    try {
      await transporteurEmail.sendMail({
        from: `"Mairie - Service des Recettes" <${process.env.SMTP_UTILISATEUR}>`,
        to: contribuable.email,
        subject: `⚠️ RAPPEL URGENT - Facture ${facture.numéro_facture} impayée`,
        html: this._composerEmailHTML(facture, contribuable, nomComplet),
      });

      await relance.update({ statut: 'envoyée' });
    } catch (erreur) {
      await relance.update({ statut: 'échouée', erreur: erreur.message });
    }

    return relance;
  }

  // Envoyer un WhatsApp de relance via Meta API
  async _envoyerWhatsApp(facture, contribuable) {
    const message = this._composerMessageRelance(facture, contribuable, 'whatsapp');

    const relance = await Relance.create({
      factureId: facture.id,
      contribuableId: contribuable.id,
      type: 'whatsapp',
      numéro: (facture.nombre_relances || 0) + 1,
      message,
      destinataire: contribuable.téléphone,
    });

    try {
      const réponse = await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_ID_TELEPHONE}/messages`,
        {
          messaging_product: 'whatsapp',
          to: contribuable.téléphone.replace('+', ''),
          type: 'text',
          text: { body: message },
        },
        { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
      );

      await relance.update({ statut: 'envoyée', réponseAPI: réponse.data });
    } catch (erreur) {
      await relance.update({ statut: 'échouée', erreur: erreur.message });
    }

    return relance;
  }

  // Appliquer les pénalités mensuelles (CRON mensuel)
  async appliquerPénalitésMensuelles() {
    // Mettre à jour les montants de pénalités des factures en retard
    await axios.post(
      `http://localhost:${process.env.PORT_RECETTES}/api/factures/calculer-pénalités`,
      {},
      { headers: { 'X-Internal-Service': 'recouvrement' } }
    ).catch(e => journaliser.error('Erreur calcul pénalités:', e.message));
  }

  // Composer le message de relance selon le canal
  _composerMessageRelance(facture, contribuable, canal) {
    const nomContribuable = contribuable.raisonSociale ||
      `${contribuable.prénom || ''} ${contribuable.nom || ''}`.trim();
    const montant = parseFloat(facture.montant_total - facture.montant_payé).toLocaleString('fr-FR');
    const échéance = new Date(facture.date_échéance).toLocaleDateString('fr-FR');

    if (canal === 'sms') {
      return `MAIRIE: Cher(e) ${nomContribuable}, votre facture N°${facture.numéro_facture} d'un montant de ${montant} FCFA est impayée depuis le ${échéance}. Régularisez rapidement pour éviter des pénalités. Info: +XXX XXX XXX`;
    }

    return `Bonjour ${nomContribuable},\n\nVotre facture municipale N°${facture.numéro_facture} (${montant} FCFA) est impayée depuis le ${échéance}.\n\nVeuillez régulariser votre situation le plus tôt possible.\n\nLa Mairie`;
  }

  // Template HTML pour l'email
  _composerEmailHTML(facture, contribuable, nomComplet) {
    const montant = parseFloat(facture.montant_total - facture.montant_payé).toLocaleString('fr-FR');
    const échéance = new Date(facture.date_échéance).toLocaleDateString('fr-FR');

    return `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
        <div style="background:#1a237e;color:white;padding:20px;text-align:center">
          <h2>🏛️ MAIRIE - SERVICE DES RECETTES</h2>
          <p>AVIS DE RAPPEL DE PAIEMENT</p>
        </div>
        <div style="padding:30px">
          <p>Cher(e) <strong>${nomComplet}</strong>,</p>
          <p>Nous vous informons que la facture municipale suivante est impayée :</p>
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <tr style="background:#f5f5f5"><td style="padding:10px;border:1px solid #ddd"><strong>N° Facture</strong></td><td style="padding:10px;border:1px solid #ddd">${facture.numéro_facture}</td></tr>
            <tr><td style="padding:10px;border:1px solid #ddd"><strong>Montant dû</strong></td><td style="padding:10px;border:1px solid #ddd;color:#d32f2f"><strong>${montant} FCFA</strong></td></tr>
            <tr style="background:#f5f5f5"><td style="padding:10px;border:1px solid #ddd"><strong>Date d'échéance</strong></td><td style="padding:10px;border:1px solid #ddd">${échéance}</td></tr>
          </table>
          <p style="color:#d32f2f">⚠️ Passé un délai supplémentaire de 30 jours, des pénalités seront appliquées et une injonction de payer pourra être émise.</p>
          <p>Pour tout règlement ou information, contactez notre service financier.</p>
        </div>
        <div style="background:#f5f5f5;padding:15px;text-align:center;font-size:12px;color:#666">
          Mairie - Service de Recouvrement des Recettes Municipales
        </div>
      </div>
    `;
  }

  // Appels aux services externes
  async _récupérerFacturesImpayées() {
    try {
      const réponse = await axios.get(
        `http://localhost:${process.env.PORT_RECETTES}/api/factures?statut=en_attente&limite=100`,
        { headers: { 'X-Internal-Service': 'recouvrement' } }
      );
      return réponse.data?.données?.rows || [];
    } catch (e) {
      journaliser.error('Impossible de récupérer les factures impayées:', e.message);
      return [];
    }
  }

  async _récupérerContribuable(contribuableId) {
    try {
      const réponse = await axios.get(
        `http://localhost:${process.env.PORT_CONTRIBUABLES}/api/contribuables/${contribuableId}`,
        { headers: { 'X-Internal-Service': 'recouvrement' } }
      );
      return réponse.data?.données;
    } catch (e) {
      return null;
    }
  }
}

export default new ServiceRelance();
