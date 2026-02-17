import winston from 'winston';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Créer le dossier de logs s'il n'existe pas
const cheminLogs = process.env.CHEMIN_LOGS || './logs';
if (!fs.existsSync(cheminLogs)) {
  fs.mkdirSync(cheminLogs, { recursive: true });
}

// Format personnalisé robuste
const formatPersonnalise = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const timestamp = info.timestamp;
    const level = info.level || 'info';
    const stack = info.stack;

    // Si message est un objet, on le stringify
    const message =
      typeof info.message === 'object'
        ? JSON.stringify(info.message)
        : info.message || '';

    // Nettoyer les métadonnées internes
    const metadonnees = { ...info };
    delete metadonnees.timestamp;
    delete metadonnees.level;
    delete metadonnees.message;
    delete metadonnees.stack;

    let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    if (Object.keys(metadonnees).length > 0) {
      log += ` | ${JSON.stringify(metadonnees)}`;
    }

    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

// Ajouter couleur pour audit
winston.addColors({ audit: 'magenta' });

// Configuration du journaliseur
export const journaliser = winston.createLogger({
  level: process.env.NIVEAU_LOGS || 'info',
  format: formatPersonnalise,
  transports: [
    // Console (développement)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        formatPersonnalise
      ),
    }),

    // Fichier erreurs
    new winston.transports.File({
      filename: path.join(cheminLogs, 'erreurs.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),

    // Fichier général
    new winston.transports.File({
      filename: path.join(cheminLogs, 'application.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),

    // Audit financier
    new winston.transports.File({
      filename: path.join(cheminLogs, 'audit-financier.log'),
      level: 'audit',
      maxsize: 50 * 1024 * 1024,
      maxFiles: 30,
    }),
  ],
});

// Middleware Express
export const journaliserRequete = (req, res, next) => {
  const debut = Date.now();

  res.on('finish', () => {
    const duree = Date.now() - debut;
    const niveau = res.statusCode >= 400 ? 'warn' : 'info';

    journaliser.log(niveau, 'Requête HTTP', {
      methode: req.method,
      url: req.originalUrl,
      statut: res.statusCode,
      duree: `${duree}ms`,
      ip: req.ip,
      utilisateur: req.utilisateur?.id || 'anonyme',
    });
  });

  next();
};

// Journalisation audit financier
export const journaliserAudit = (action, utilisateur, donnees) => {
  journaliser.log('audit', 'Audit financier', {
    action,
    utilisateurId: utilisateur?.id,
    role: utilisateur?.role,
    donnees,
    horodatage: new Date().toISOString(),
  });
};

export default journaliser;
