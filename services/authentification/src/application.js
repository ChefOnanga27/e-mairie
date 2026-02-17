import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connecterBaseDeDonnées } from '../../../partagé/modeles/configurationBD.js';
import { journaliser, journaliserRequête } from '../../../partagé/utilitaires/journalisation.js';
import { gestionnaireErreurs, routeIntrouvable } from '../../../partagé/middlewares/gestionErreurs.js';
import routesAuthentification from './routes/routesAuthentification.js';
import routesUtilisateurs from './routes/routesUtilisateurs.js';
import { synchroniserModèlesAuth } from './modeles/index.js';

dotenv.config();

const application = express();
const PORT = process.env.PORT_AUTHENTIFICATION || 3001;

// ─── Middlewares de sécurité ───────────────────────────────────────────────
application.use(helmet());
application.use(cors({ origin: process.env.ORIGINES_CORS?.split(',') || '*' }));
application.use(express.json({ limit: '10mb' }));
application.use(express.urlencoded({ extended: true }));
application.use(journaliserRequête);

// Limitation des tentatives de connexion
const limiteurConnexion = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { succès: false, message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Routes ───────────────────────────────────────────────────────────────
application.use('/api/auth', limiteurConnexion, routesAuthentification);
application.use('/api/utilisateurs', routesUtilisateurs);

// Vérification de santé du service
application.get('/sante', (req, res) => {
  res.json({
    service: 'authentification',
    statut: 'actif',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ─── Gestion des erreurs ──────────────────────────────────────────────────
application.use(routeIntrouvable);
application.use(gestionnaireErreurs);

// ─── Démarrage du serveur ─────────────────────────────────────────────────
const démarrer = async () => {
  try {
    await connecterBaseDeDonnées('Service Authentification');
    await synchroniserModèlesAuth();

    application.listen(PORT, () => {
      journaliser.info(`🔐 Service Authentification démarré sur le port ${PORT}`);
    });
  } catch (erreur) {
    journaliser.error('Échec du démarrage du service authentification:', erreur);
    process.exit(1);
  }
};

démarrer();

export default application;
