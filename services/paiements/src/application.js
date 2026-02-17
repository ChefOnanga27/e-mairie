import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { connecterBaseDeDonnées } from '../../../partagé/modeles/configurationBD.js';
import { journaliser, journaliserRequête } from '../../../partagé/utilitaires/journalisation.js';
import { gestionnaireErreurs, routeIntrouvable } from '../../../partagé/middlewares/gestionErreurs.js';
import { vérifierToken } from '../../../partagé/middlewares/authentification.js';
import routesPaiements from './routes/routesPaiements.js';
import routesQuittances from './routes/routesQuittances.js';
import { synchroniserModèlesPaiements } from './modeles/index.js';

dotenv.config();

const application = express();
const PORT = process.env.PORT_PAIEMENTS || 3004;

application.use(helmet());
application.use(cors());
application.use(express.json({ limit: '10mb' }));
application.use(journaliserRequête);

application.use('/api/paiements', vérifierToken, routesPaiements);
application.use('/api/quittances', vérifierToken, routesQuittances);

// Webhook Mobile Money (pas d'auth JWT, utilise signature HMAC)
import routesWebhooks from './routes/routesWebhooks.js';
application.use('/api/webhooks', routesWebhooks);

application.get('/sante', (req, res) => {
  res.json({ service: 'paiements', statut: 'actif', timestamp: new Date().toISOString() });
});

application.use(routeIntrouvable);
application.use(gestionnaireErreurs);

const démarrer = async () => {
  try {
    await connecterBaseDeDonnées('Service Paiements');
    await synchroniserModèlesPaiements();
    application.listen(PORT, () => {
      journaliser.info(`💳 Service Paiements démarré sur le port ${PORT}`);
    });
  } catch (erreur) {
    journaliser.error('Échec du démarrage service paiements:', erreur);
    process.exit(1);
  }
};

démarrer();
export default application;
