import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Middleware de vérification du token JWT
export const vérifierToken = (req, res, next) => {
  const entêteAuthorisation = req.headers['authorization'];

  if (!entêteAuthorisation) {
    return res.status(401).json({
      succès: false,
      message: 'Accès refusé. Token d\'authentification manquant.',
    });
  }

  const parties = entêteAuthorisation.split(' ');
  if (parties.length !== 2 || parties[0] !== 'Bearer') {
    return res.status(401).json({
      succès: false,
      message: 'Format du token invalide. Utiliser: Bearer <token>',
    });
  }

  const token = parties[1];

  try {
    const données = jwt.verify(token, process.env.JWT_SECRET);
    req.utilisateur = données;
    next();
  } catch (erreur) {
    if (erreur.name === 'TokenExpiredError') {
      return res.status(401).json({
        succès: false,
        message: 'Session expirée. Veuillez vous reconnecter.',
      });
    }
    return res.status(403).json({
      succès: false,
      message: 'Token invalide ou falsifié.',
    });
  }
};

// Middleware de vérification des rôles
export const autoriserRôles = (...rôlesAutorisés) => {
  return (req, res, next) => {
    if (!req.utilisateur) {
      return res.status(401).json({
        succès: false,
        message: 'Authentification requise.',
      });
    }

    const rôleUtilisateur = req.utilisateur.rôle;

    if (!rôlesAutorisés.includes(rôleUtilisateur)) {
      return res.status(403).json({
        succès: false,
        message: `Accès interdit. Rôle requis: ${rôlesAutorisés.join(' ou ')}`,
        rôleActuel: rôleUtilisateur,
      });
    }

    next();
  };
};

// Génération du token JWT
export const générerToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION || '24h',
    issuer: 'plateforme-municipale',
    audience: 'utilisateurs-mairie',
  });
};

// Génération du refresh token
export const générerRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  });
};

// Constantes des rôles disponibles
export const RÔLES = {
  ADMIN_SYSTÈME: 'admin_système',
  MAIRIE_EXÉCUTIF: 'mairie_exécutif',
  AGENT_FINANCIER: 'agent_financier',
  AGENT_RÉGIE: 'agent_régie',
  TRÉSOR_PUBLIC: 'trésor_public',
  TUTELLE: 'tutelle',
  JUSTICE: 'justice',
  CITOYEN: 'citoyen',
  ENTREPRISE: 'entreprise',
};
