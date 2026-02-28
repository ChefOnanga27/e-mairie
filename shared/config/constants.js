// ============================================
// CONSTANTES GLOBALES
// ============================================

export default {
  // Rôles
  ROLES: {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN_MAIRIE: 'ADMIN_MAIRIE',
    AGENT: 'AGENT',
    CONTRIBUABLE: 'CONTRIBUABLE',
  },

  // Statuts demande
  STATUT_DEMANDE: {
    EN_ATTENTE: 'EN_ATTENTE',
    EN_COURS: 'EN_COURS',
    APPROUVEE: 'APPROUVEE',
    REJETEE: 'REJETEE',
    LIVREE: 'LIVREE',
  },

  // Statuts document
  STATUT_DOCUMENT: {
    BROUILLON: 'BROUILLON',
    EN_ATTENTE: 'EN_ATTENTE',
    VALIDE: 'VALIDE',
    REJETE: 'REJETE',
    EXPIRE: 'EXPIRE',
  },

  // Types personne
  TYPE_PERSONNE: {
    PHYSIQUE: 'PHYSIQUE',
    MORALE: 'MORALE',
  },

  // Modes paiement
  MODE_PAIEMENT: {
    ESPECES: 'ESPECES',
    VIREMENT: 'VIREMENT',
    MOBILE_MONEY: 'MOBILE_MONEY',
    CHEQUE: 'CHEQUE',
  },

  // Types notification
  TYPE_NOTIFICATION: {
    EMAIL: 'EMAIL',
    SMS: 'SMS',
  },

  // Statuts notification
  STATUT_NOTIFICATION: {
    EN_ATTENTE: 'EN_ATTENTE',
    ENVOYE: 'ENVOYE',
    ECHOUE: 'ECHOUE',
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  // Messages erreurs communs
  MESSAGES: {
    NOT_FOUND: 'Ressource non trouvée',
    UNAUTHORIZED: 'Non autorisé',
    FORBIDDEN: 'Accès refusé',
    VALIDATION_ERROR: 'Erreur de validation',
    INTERNAL_ERROR: 'Erreur interne du serveur',
    CREATED: 'Créé avec succès',
    UPDATED: 'Mis à jour avec succès',
    DELETED: 'Supprimé avec succès',
  },
};