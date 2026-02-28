import { createLogger } from './logger.js';
const logger = createLogger('error-handler');

/**
 * Middleware global de gestion des erreurs
 */
const errorHandler = (err, req, res, next) => {
  logger.error('Erreur non gérée', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
  });

  // Erreur Prisma - Record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Ressource non trouvée',
    });
  }

  // Erreur Prisma - Unique constraint
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'champ';
    return res.status(409).json({
      success: false,
      message: `La valeur du champ '${field}' existe déjà`,
    });
  }

  // Erreur Prisma - Foreign key
  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      message: 'Référence invalide - La ressource liée n\'existe pas',
    });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré',
    });
  }

  // Erreur de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: err.details,
    });
  }

  // Erreur générique
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur'
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

/**
 * Middleware 404 - Route non trouvée
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.originalUrl}`,
  });
};

export { errorHandler, notFound }; 