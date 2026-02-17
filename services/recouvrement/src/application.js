import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import dotenv from 'dotenv';

import { connecterBaseDeDonnées } from '../../../partagé/modeles/configurationBD.js';
import { journaliser, journaliserRequête } from '../../../partagé/utilitaires/journalisation.js';
import { gestionnaireErreurs, routeIntrouvable } from '../../../partagé/middlewares/gestionErreurs.js';
import { vérifierToken } from '../../../partagé/middlewares/authentification.js';
import routesRelances from './routes/routesRelances.js';
import routesInjonctions from './routes/routesInjonctions.js';
import serviceRelance from './services/serviceRelance.js';
import { synchroniserModèlesRecouvrement } from './modeles/index.js';

dotenv.config();

const application = express();
const PORT = process.env.PORT_RECOUVREMENT || 3005;

application.use(helmet());
application.use(cors());
application.use(express.json());
application.use(journaliserRequête);

application.use('/api/relances', vérifierToken, routesRelances);
application.use('/api/injonctions', vérifierToken, routesInjonctions);

application.get('/sante', (req, res) => {
  res.json({ service: 'recouvrement', statut: 'actif', timestamp: new Date().toISOString() });
});

application.use(routeIntrouvable);
application.use(gestionnaireErreurs);

// ─── Tâches planifiées (CRON) ─────────────────────────────────────────────

// Relances automatiques quotidiennes à 8h du matin
const planifierRelancesAutomatiques = () => {
  cron.schedule('0 8 * * *', async () => {
    journaliser.info('🔔 Déclenchement des relances automatiques quotidiennes...');
    try {
      await serviceRelance.envoyerRelancesAutomatiques();
      journaliser.info('✅ Relances automatiques terminées');
    } catch (erreur) {
      journaliser.error('❌ Erreur lors des relances automatiques:', erreur);
    }
  }, { timezone: 'Africa/Abidjan' });

  // Application des pénalités le 1er de chaque mois
  cron.schedule('0 6 1 * *', async () => {
    journaliser.info('💰 Application des pénalités mensuelles...');
    try {
      await serviceRelance.appliquerPénalitésMensuelles();
    } catch (erreur) {
      journaliser.error('Erreur application pénalités:', erreur);
    }
  }, { timezone: 'Africa/Abidjan' });
};

const démarrer = async () => {
  try {
    await connecterBaseDeDonnées('Service Recouvrement');
    await synchroniserModèlesRecouvrement();
    planifierRelancesAutomatiques();
    application.listen(PORT, () => {
      journaliser.info(`🔍 Service Recouvrement démarré sur le port ${PORT}`);
    });
  } catch (erreur) {
    journaliser.error('Échec du démarrage service recouvrement:', erreur);
    process.exit(1);
  }
};

démarrer();
export default application;
