import serviceAuthentification from '../services/serviceAuthentification.js';
import { répondreSuccès, répondreCréé, répondreErreur } from '../../../../partagé/utilitaires/réponses.js';

class ContrôleurAuthentification {
  // POST /api/auth/connexion
  async connexion(req, res, next) {
    try {
      const { email, motDePasse } = req.body;
      const adresseIP = req.ip;
      const agentUtilisateur = req.headers['user-agent'];

      if (!email || !motDePasse) {
        return répondreErreur(res, 'Email et mot de passe requis', 400);
      }

      const résultat = await serviceAuthentification.connecter(email, motDePasse, adresseIP, agentUtilisateur);

      return répondreSuccès(res, résultat, 'Connexion réussie');
    } catch (erreur) {
      next(erreur);
    }
  }

  // POST /api/auth/inscription
  async inscription(req, res, next) {
    try {
      const utilisateur = await serviceAuthentification.inscrire(req.body, req.ip);
      return répondreCréé(res, utilisateur, 'Compte créé avec succès');
    } catch (erreur) {
      next(erreur);
    }
  }

  // POST /api/auth/déconnexion
  async déconnexion(req, res, next) {
    try {
      await serviceAuthentification.déconnecter(req.utilisateur.id, req.ip);
      return répondreSuccès(res, null, 'Déconnexion réussie');
    } catch (erreur) {
      next(erreur);
    }
  }

  // GET /api/auth/profil
  async profil(req, res, next) {
    try {
      return répondreSuccès(res, req.utilisateur, 'Profil récupéré');
    } catch (erreur) {
      next(erreur);
    }
  }
}

export default new ContrôleurAuthentification();
