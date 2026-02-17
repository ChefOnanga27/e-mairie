import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../../partagé/modeles/configurationBD.js';

class Relance extends Model {}

Relance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    factureId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    contribuableId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('sms', 'email', 'whatsapp', 'courrier', 'appel'),
      allowNull: false,
    },
    numéro: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Numéro de la relance (1ère, 2ème, 3ème...)',
    },
    statut: {
      type: DataTypes.ENUM('en_cours', 'envoyée', 'échouée', 'non_applicable'),
      defaultValue: 'en_cours',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Contenu du message envoyé',
    },
    destinataire: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Email ou numéro de téléphone destinataire',
    },
    réponseAPI: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    erreur: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    envoyéePar: {
      type: DataTypes.ENUM('automatique', 'agent'),
      defaultValue: 'automatique',
    },
    agentId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Relance',
    tableName: 'relances',
    indexes: [
      { fields: ['facture_id'] },
      { fields: ['contribuable_id'] },
      { fields: ['statut'] },
      { fields: ['created_at'] },
    ],
  }
);

export default Relance;
