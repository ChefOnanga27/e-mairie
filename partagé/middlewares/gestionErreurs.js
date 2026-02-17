import { journaliser } from '../utilitaires/journalisation.js';

// Classe d'erreur personnalisée de l'application
export class ErreurApplication extends Error {
  constructor(message, codeStatut = 500, données = null) {
    super(message);
    this.name = 'ErreurApplication';
    this.codeStatut = codeStatut;
    this.données = données;
    this.timestamp = new Date().toISOString();
  }
}

// Classe pour les erreurs de validation
export class ErreurValidation extends ErreurApplication {
  constructor(message, détails = []) {
    super(message, 422, détails);
    this.name = 'ErreurValidation';
  }
}

// Classe pour les erreurs de ressource introuvable
export class ErreurIntrouvable extends ErreurApplication {
  constructor(ressource = 'Ressource') {
    super(`${ressource} introuvable`, 404);
    this.name = 'ErreurIntrouvable';
  }
}

// Middleware de gestion globale des erreurs
export const gestionnaireErreurs = (erreur, req, res, next) => {
  journaliser.error({
    message: erreur.message,
    pile: erreur.stack,
    url: req.originalUrl,
    méthode: req.method,
    ip: req.ip,
    utilisateur: req.utilisateur?.id || 'anonyme',
  });

  // Erreurs de validation Sequelize
  if (erreur.name === 'SequelizeValidationError' || erreur.name === 'SequelizeUniqueConstraintError') {
    const messages = erreur.errors?.map(e => e.message) || [erreur.message];
    return res.status(422).json({
      succès: false,
      message: 'Erreur de validation des données',
      erreurs: messages,
    });
  }

  // Erreurs de contrainte de clé étrangère
  if (erreur.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      succès: false,
      message: 'Conflit de données : référence invalide',
    });
  }

  // Erreurs personnalisées de l'application
  if (erreur instanceof ErreurApplication) {
    return res.status(erreur.codeStatut).json({
      succès: false,
      message: erreur.message,
      données: erreur.données,
      timestamp: erreur.timestamp,
    });
  }

  // Erreur interne du serveur (par défaut)
  return res.status(500).json({
    succès: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Une erreur interne s\'est produite'
      : erreur.message,
    timestamp: new Date().toISOString(),
  });
};

// Middleware pour les routes non trouvées
export const routeIntrouvable = (req, res) => {
  res.status(404).json({
    succès: false,
    message: `Route ${req.method} ${req.originalUrl} introuvable`,
  });
};
