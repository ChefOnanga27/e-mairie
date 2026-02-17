import { Router } from 'express';
import contrôleurAuthentification from '../controleurs/contrôleurAuthentification.js';
import { vérifierToken } from '../../../../partagé/middlewares/authentification.js';

const routeur = Router();

// Routes publiques (sans authentification)
routeur.post('/connexion', contrôleurAuthentification.connexion);
routeur.post('/inscription', contrôleurAuthentification.inscription);

// Routes protégées (avec authentification)
routeur.post('/déconnexion', vérifierToken, contrôleurAuthentification.déconnexion);
routeur.get('/profil', vérifierToken, contrôleurAuthentification.profil);

export default routeur;
