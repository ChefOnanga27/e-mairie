import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { createLogger } from '../../shared/middleware/logger.js';

dotenv.config();

const logger = createLogger('api-gateway');
const app = express();
const PORT = process.env.PORT || 3000;

// Sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging HTTP
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// 404 & Error handlers
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(` API Gateway démarré sur le port ${PORT}`);
  logger.info(`   ENV: ${process.env.NODE_ENV}`);
});

export default app;