import { Op } from 'sequelize';
import { Utilisateur, JournalAudit } from '../modeles/index.js';
import {
  générerToken,
  générerRefreshToken,
} from '../../../../partagé/middlewares/authentification.js';
import {
  ErreurApplication,
  ErreurValidation,
  ErreurIntrouvable,
} from '../../../../partagé/middlewares/gestionErreurs.js';

const MAX_TENTATIVES = 5;
const DURÉE_BLOCAGE = 30 * 60 * 1000; // 30 minutes

class ServiceAuthentification {
  // Connexion d'un utilisateur
  async connecter(email, motDePasse, adresseIP, agentUtilisateur) {
    const utilisateur = await Utilisateur.findOne({ where: { email } });

    if (!utilisateur) {
      await this._journaliserAction(null, 'connexion_échouée', adresseIP, agentUtilisateur, 'échec', 'Email introuvable');
      throw new ErreurApplication('Identifiants incorrects', 401);
    }

    // Vérifier si le compte est bloqué
    if (utilisateur.compteBloquéJusqu && utilisateur.compteBloquéJusqu > new Date()) {
      const minutesRestantes = Math.ceil((utilisateur.compteBloquéJusqu - new Date()) / 60000);
      throw new ErreurApplication(
        `Compte temporairement bloqué. Réessayez dans ${minutesRestantes} minutes.`,
        423
      );
    }

    // Vérifier le mot de passe
    const motDePasseValide = await utilisateur.vérifierMotDePasse(motDePasse);

    if (!motDePasseValide) {
      await this._gérerÉchecConnexion(utilisateur);
      await this._journaliserAction(utilisateur.id, 'connexion_échouée', adresseIP, agentUtilisateur, 'échec', 'Mot de passe incorrect');
      throw new ErreurApplication('Identifiants incorrects', 401);
    }

    if (!utilisateur.estActif) {
      throw new ErreurApplication('Compte désactivé. Contactez l\'administration.', 403);
    }

    // Réinitialiser les tentatives et mettre à jour la dernière connexion
    await utilisateur.update({
      tentativesConnexion: 0,
      compteBloquéJusqu: null,
      dernièreConnexion: new Date(),
    });

    const payload = {
      id: utilisateur.id,
      email: utilisateur.email,
      rôle: utilisateur.rôle,
      nom: utilisateur.nom,
      prénom: utilisateur.prénom,
    };

    const token = générerToken(payload);
    const refreshToken = générerRefreshToken({ id: utilisateur.id });

    await this._journaliserAction(utilisateur.id, 'connexion_réussie', adresseIP, agentUtilisateur, 'succès');

    return {
      token,
      refreshToken,
      utilisateur: utilisateur.toJSON(),
      expireEn: process.env.JWT_EXPIRATION || '24h',
    };
  }

  // Inscription d'un nouvel utilisateur
  async inscrire(données, adresseIP) {
    const { nom, prénom, email, téléphone, motDePasse, rôle } = données;

    // Vérifier si l'email existe déjà
    const emailExistant = await Utilisateur.findOne({ where: { email } });
    if (emailExistant) {
      throw new ErreurValidation('Un compte avec cet email existe déjà');
    }

    const nouvelUtilisateur = await Utilisateur.create({
      nom,
      prénom,
      email,
      téléphone,
      motDePasseHaché: motDePasse,
      rôle: rôle || 'citoyen',
    });

    await this._journaliserAction(nouvelUtilisateur.id, 'inscription', adresseIP, null, 'succès');

    return nouvelUtilisateur.toJSON();
  }

  // Déconnexion (invalidation côté client via liste noire)
  async déconnecter(utilisateurId, adresseIP) {
    await this._journaliserAction(utilisateurId, 'déconnexion', adresseIP, null, 'succès');
    return { message: 'Déconnexion réussie' };
  }

  // Gestion des tentatives de connexion échouées
  async _gérerÉchecConnexion(utilisateur) {
    const tentatives = utilisateur.tentativesConnexion + 1;
    const miseàJour = { tentativesConnexion: tentatives };

    if (tentatives >= MAX_TENTATIVES) {
      miseàJour.compteBloquéJusqu = new Date(Date.now() + DURÉE_BLOCAGE);
    }

    await utilisateur.update(miseàJour);
  }

  // Journaliser une action dans l'audit
  async _journaliserAction(utilisateurId, action, adresseIP, agentUtilisateur, résultat, détailsErreur = null) {
    await JournalAudit.create({
      utilisateurId,
      action,
      adresseIP,
      agentUtilisateur,
      résultat,
      détailsErreur,
      service: 'authentification',
    });
  }
}

export default new ServiceAuthentification();
