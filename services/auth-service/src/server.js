import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes.js';
import { errorHandler, notFound } from '../../../shared/middleware/errorHandler.js';
import { createLogger, httpLogger } from '../../../shared/middleware/logger.js';

const logger = createLogger('auth-service');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(httpLogger(logger));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(` Auth Service démarré sur le port ${PORT}`);
});

export default app;