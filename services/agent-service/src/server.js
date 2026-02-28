import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import agentRoutes from './routes/agent.routes.js';
import { errorHandler, notFound } from '../../../shared/middleware/errorHandler.js';
import { createLogger, httpLogger } from '../../../shared/middleware/logger.js';

dotenv.config();

const logger = createLogger('agent-service');
const app = express();
const PORT = process.env.PORT || 3005;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(httpLogger(logger));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'agent-service', timestamp: new Date().toISOString() });
});

app.use('/api/agent', agentRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Agent Service démarré sur le port ${PORT}`);
});

export default app;