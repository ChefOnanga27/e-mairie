import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { connecterBaseDeDonnées } from '../../../partagé/modeles/configurationBD.js';
import { journaliser, journaliserRequête } from '../../../partagé/utilitaires/journalisation.js';
import { gestionnaireErreurs, routeIntrouvable } from '../../../partagé/middlewares/gestionErreurs.js';
import { vérifierToken } from '../../../partagé/middlewares/authentification.js';
import routesTypesTaxes from './routes/routesTypesTaxes.js';
import routesFactures from './routes/routesFactures.js';
import { synchroniserModèlesRecettes } from './modeles/index.js';

dotenv.config();

const application = express();
const PORT = process.env.PORT_RECETTES || 3003;

application.use(helmet());
application.use(cors());
application.use(express.json({ limit: '10mb' }));
application.use(journaliserRequête);

application.use('/api/types-taxes', vérifierToken, routesTypesTaxes);
application.use('/api/factures', vérifierToken, routesFactures);

application.get('/sante', (req, res) => {
  res.json({ service: 'recettes', statut: 'actif', timestamp: new Date().toISOString() });
});

application.use(routeIntrouvable);
application.use(gestionnaireErreurs);

const démarrer = async () => {
  try {
    await connecterBaseDeDonnées('Service Recettes');
    await synchroniserModèlesRecettes();
    application.listen(PORT, () => {
      journaliser.info(`💰 Service Recettes démarré sur le port ${PORT}`);
    });
  } catch (erreur) {
    journaliser.error('Échec du démarrage service recettes:', erreur);
    process.exit(1);
  }
};

démarrer();
export default application;
