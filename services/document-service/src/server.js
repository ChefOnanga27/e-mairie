import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import routes from './routes/document.routes.js';
import { errorHandler, notFound } from '../../../shared/middleware/errorHandler.js';
import { createLogger, httpLogger } from '../../../shared/middleware/logger.js';

const logger = createLogger('document-service');
const app = express();
const PORT = process.env.PORT || 3007;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(httpLogger(logger));

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'document-service', timestamp: new Date().toISOString() });
});

app.use('/api/documents', routes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(` Document Service démarré sur le port ${PORT}`);
});

export default app;