import winston from 'winston';
import path from 'path';
import fs from 'fs';

const LOG_DIR = process.env.LOG_DIR || './logs';

// Créer le dossier logs s'il n'existe pas
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${service || 'app'}] ${level}: ${message}${metaStr}`;
  })
);

/**
 * Crée un logger Winston pour un service
 * @param {string} serviceName - Nom du service
 */
const createLogger = (serviceName) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: serviceName },
    format: logFormat,
    transports: [
      new winston.transports.Console({
        format: consoleFormat,
      }),
      new winston.transports.File({
        filename: path.join(LOG_DIR, `${serviceName}.log`),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: path.join(LOG_DIR, 'error.log'),
        level: 'error',
        maxsize: 5242880,
        maxFiles: 5,
      }),
    ],
  });
};

/**
 * Middleware de log HTTP pour Express
 */
const httpLogger = (logger) => {
  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP Request', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userId: req.user?.id,
      });
    });

    next();
  };
};

export { createLogger, httpLogger }; 