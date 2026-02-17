import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { connecterBaseDeDonnées } from '../../../partagé/modeles/configurationBD.js';
import { journaliser, journaliserRequête } from '../../../partagé/utilitaires/journalisation.js';
import { gestionnaireErreurs, routeIntrouvable } from '../../../partagé/middlewares/gestionErreurs.js';
import { vérifierToken } from '../../../partagé/middlewares/authentification.js';
import routesContribuables from './routes/routesContribuables.js';
import { synchroniserModèlesContribuables } from './modeles/index.js';

dotenv.config();

const application = express();
const PORT = process.env.PORT_CONTRIBUABLES || 3002;

application.use(helmet());
application.use(cors());
application.use(express.json({ limit: '10mb' }));
application.use(journaliserRequête);

// Toutes les routes requièrent une authentification
application.use('/api/contribuables', vérifierToken, routesContribuables);

application.get('/sante', (req, res) => {
  res.json({ service: 'contribuables', statut: 'actif', timestamp: new Date().toISOString() });
});

application.use(routeIntrouvable);
application.use(gestionnaireErreurs);

const démarrer = async () => {
  try {
    await connecterBaseDeDonnées('Service Contribuables');
    await synchroniserModèlesContribuables();
    application.listen(PORT, () => {
      journaliser.info(`👤 Service Contribuables démarré sur le port ${PORT}`);
    });
  } catch (erreur) {
    journaliser.error('Échec du démarrage service contribuables:', erreur);
    process.exit(1);
  }
};

démarrer();
export default application;
