import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';

import { journaliser } from '../partagé/utilitaires/journalisation.js';
import { gestionnaireErreurs, routeIntrouvable } from '../partagé/middlewares/gestionErreurs.js';
import { vérifierToken } from '../partagé/middlewares/authentification.js';

dotenv.config();

const application = express();
const PORT = process.env.PORT_PASSERELLE || 3000;

// ─── Configuration des services ───────────────────────────────────────────
const configServices = {
  authentification: `http://localhost:${process.env.PORT_AUTHENTIFICATION || 3001}`,
  contribuables:    `http://localhost:${process.env.PORT_CONTRIBUABLES    || 3002}`,
  recettes:         `http://localhost:${process.env.PORT_RECETTES         || 3003}`,
  paiements:        `http://localhost:${process.env.PORT_PAIEMENTS        || 3004}`,
  recouvrement:     `http://localhost:${process.env.PORT_RECOUVREMENT     || 3005}`,
  tableauxDeBord:   `http://localhost:${process.env.PORT_TABLEAUX_DE_BORD|| 3006}`,
  notifications:    `http://localhost:${process.env.PORT_NOTIFICATIONS    || 3007}`,
};

// ─── Middlewares globaux ──────────────────────────────────────────────────
application.use(helmet({
  contentSecurityPolicy: false, // Désactivé pour faciliter le développement
}));

application.use(cors({
  origin: process.env.ORIGINES_CORS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Service'],
  credentials: true,
}));

application.use(morgan('combined', {
  stream: { write: (message) => journaliser.info(message.trim()) },
}));

// Limitation globale des requêtes
application.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { succès: false, message: 'Trop de requêtes. Réessayez dans 15 minutes.' },
  standardHeaders: true,
}));

// ─── Configuration du proxy par service ──────────────────────────────────
const créerProxy = (cible, options = {}) => {
  return createProxyMiddleware({
    target: cible,
    changeOrigin: true,
    on: {
      error: (err, req, res) => {
        journaliser.error(`Erreur proxy vers ${cible}:`, err.message);
        if (!res.headersSent) {
          res.status(503).json({
            succès: false,
            message: 'Service temporairement indisponible',
            service: cible,
          });
        }
      },
    },
    ...options,
  });
};

// ─── Routes publiques (sans authentification) ─────────────────────────────
application.use(
  '/api/auth',
  créerProxy(configServices.authentification)
);

// Vérification de quittance (publique)
application.use(
  '/api/quittances/vérifier',
  créerProxy(configServices.paiements)
);

// Webhook Mobile Money (publique, sécurisée par HMAC)
application.use(
  '/api/webhooks',
  créerProxy(configServices.paiements)
);

// ─── Routes protégées (avec authentification) ─────────────────────────────
application.use(
  '/api/utilisateurs',
  vérifierToken,
  créerProxy(configServices.authentification)
);

application.use(
  '/api/contribuables',
  vérifierToken,
  créerProxy(configServices.contribuables)
);

application.use(
  '/api/types-taxes',
  vérifierToken,
  créerProxy(configServices.recettes)
);

application.use(
  '/api/factures',
  vérifierToken,
  créerProxy(configServices.recettes)
);

application.use(
  '/api/paiements',
  vérifierToken,
  créerProxy(configServices.paiements)
);

application.use(
  '/api/quittances',
  vérifierToken,
  créerProxy(configServices.paiements)
);

application.use(
  '/api/relances',
  vérifierToken,
  créerProxy(configServices.recouvrement)
);

application.use(
  '/api/injonctions',
  vérifierToken,
  créerProxy(configServices.recouvrement)
);

application.use(
  '/api/tableau-de-bord',
  vérifierToken,
  créerProxy(configServices.tableauxDeBord)
);

application.use(
  '/api/notifications',
  vérifierToken,
  créerProxy(configServices.notifications)
);

// ─── Route de santé de la passerelle ─────────────────────────────────────
application.get('/sante', (req, res) => {
  res.json({
    service: 'passerelle-api',
    statut: 'actif',
    version: '1.0.0',
    services: Object.keys(configServices),
    timestamp: new Date().toISOString(),
  });
});

// Vérification de santé de tous les services
application.get('/sante/services', async (req, res) => {
  const { default: axios } = await import('axios');
  const états = {};

  await Promise.allSettled(
    Object.entries(configServices).map(async ([nom, url]) => {
      try {
        await axios.get(`${url}/sante`, { timeout: 3000 });
        états[nom] = 'actif';
      } catch {
        états[nom] = 'inactif';
      }
    })
  );

  const tousActifs = Object.values(états).every(s => s === 'actif');
  res.status(tousActifs ? 200 : 207).json({
    passerelle: 'actif',
    services: états,
    timestamp: new Date().toISOString(),
  });
});

// ─── Gestion des erreurs ──────────────────────────────────────────────────
application.use(routeIntrouvable);
application.use(gestionnaireErreurs);

// ─── Démarrage ────────────────────────────────────────────────────────────
application.listen(PORT, () => {
  journaliser.info(`
  ╔═══════════════════════════════════════════════════════╗
  ║   🏛️  PLATEFORME MUNICIPALE - PASSERELLE API          ║
  ║   Port : ${PORT}                                          ║
  ║   Environnement : ${process.env.NODE_ENV || 'developpement'}            ║
  ╚═══════════════════════════════════════════════════════╝
  `);
});

export default application;
