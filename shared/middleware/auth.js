import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';

/**
 * Middleware de vérification JWT
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'Token manquant ou invalide');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token expiré');
    }
    return sendError(res, 401, 'Token invalide');
  }
};

/**
 * Middleware de vérification des rôles
 * @param {...string} roles - Rôles autorisés
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Non authentifié');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, 'Accès refusé - Rôle insuffisant');
    }

    next();
  };
};

export { authenticate, authorize }; 