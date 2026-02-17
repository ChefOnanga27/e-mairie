import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../../partagé/modeles/configurationBD.js';

class JournalAudit extends Model {}

JournalAudit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    utilisateurId: {
      type: DataTypes.UUID,
      allowNull: true, // Null pour les actions anonymes
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Ex: connexion, déconnexion, modification_profil, paiement_effectué',
    },
    table: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Table de base de données concernée',
    },
    enregistrementId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'ID de l\'enregistrement modifié',
    },
    anciennesValeurs: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Valeurs avant modification',
    },
    nouvellesValeurs: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Valeurs après modification',
    },
    adresseIP: {
      type: DataTypes.INET,
      allowNull: true,
    },
    agentUtilisateur: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    résultat: {
      type: DataTypes.ENUM('succès', 'échec', 'erreur'),
      defaultValue: 'succès',
    },
    détailsErreur: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    service: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'inconnu',
      comment: 'Microservice à l\'origine de l\'action',
    },
  },
  {
    sequelize,
    modelName: 'JournalAudit',
    tableName: 'journal_audit',
    paranoid: false, // Les logs d'audit ne sont jamais supprimés
    indexes: [
      { fields: ['utilisateur_id'] },
      { fields: ['action'] },
      { fields: ['created_at'] },
      { fields: ['service'] },
    ],
  }
);

export default JournalAudit;
