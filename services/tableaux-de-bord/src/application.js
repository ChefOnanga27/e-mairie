import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { connecterBaseDeDonnées } from '../../../partagé/modeles/configurationBD.js';
import { journaliser, journaliserRequête } from '../../../partagé/utilitaires/journalisation.js';
import { gestionnaireErreurs, routeIntrouvable } from '../../../partagé/middlewares/gestionErreurs.js';
import { vérifierToken, autoriserRôles, RÔLES } from '../../../partagé/middlewares/authentification.js';
import routesMairie from './routes/routesMairie.js';
import routesTrésor from './routes/routesTrésor.js';
import routesCitoyen from './routes/routesCitoyen.js';
import routesRégie from './routes/routesRégie.js';

dotenv.config();

const application = express();
const PORT = process.env.PORT_TABLEAUX_DE_BORD || 3006;

application.use(helmet());
application.use(cors());
application.use(express.json());
application.use(journaliserRequête);

// Dashboards par rôle
application.use('/api/tableau-de-bord/mairie', vérifierToken,
  autoriserRôles(RÔLES.MAIRIE_EXÉCUTIF, RÔLES.ADMIN_SYSTÈME, RÔLES.TUTELLE),
  routesMairie
);

application.use('/api/tableau-de-bord/trésor', vérifierToken,
  autoriserRôles(RÔLES.TRÉSOR_PUBLIC, RÔLES.ADMIN_SYSTÈME),
  routesTrésor
);

application.use('/api/tableau-de-bord/régie', vérifierToken,
  autoriserRôles(RÔLES.AGENT_RÉGIE, RÔLES.AGENT_FINANCIER, RÔLES.ADMIN_SYSTÈME),
  routesRégie
);

application.use('/api/tableau-de-bord/citoyen', vérifierToken,
  autoriserRôles(RÔLES.CITOYEN, RÔLES.ENTREPRISE),
  routesCitoyen
);

application.get('/sante', (req, res) => {
  res.json({ service: 'tableaux-de-bord', statut: 'actif', timestamp: new Date().toISOString() });
});

application.use(routeIntrouvable);
application.use(gestionnaireErreurs);

const démarrer = async () => {
  try {
    await connecterBaseDeDonnées('Service Tableaux de Bord');
    application.listen(PORT, () => {
      journaliser.info(`📊 Service Tableaux de Bord démarré sur le port ${PORT}`);
    });
  } catch (erreur) {
    journaliser.error('Échec du démarrage:', erreur);
    process.exit(1);
  }
};

démarrer();
export default application;
