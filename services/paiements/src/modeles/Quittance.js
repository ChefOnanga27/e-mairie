import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../../partagé/modeles/configurationBD.js';
import Paiement from './Paiement.js';

class Quittance extends Model {}

Quittance.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    numéroQuittance: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    paiementId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: Paiement, key: 'id' },
    },
    factureId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    contribuableId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    montantPayé: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    dateÉmission: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    codeQR: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Contenu du QR code pour vérification d\'authenticité',
    },
    codeVérification: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Code alphanumérique court pour vérification manuelle',
    },
    estValide: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    signatureNumérique: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Hash SHA-256 de la quittance pour garantir l\'intégrité',
    },
    émisePar: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID de l\'agent ou du système ayant émis la quittance',
    },
  },
  {
    sequelize,
    modelName: 'Quittance',
    tableName: 'quittances',
    paranoid: false, // Les quittances ne sont jamais supprimées
    indexes: [
      { fields: ['numéro_quittance'], unique: true },
      { fields: ['paiement_id'] },
      { fields: ['contribuable_id'] },
      { fields: ['code_vérification'] },
    ],
  }
);

// Associations
Quittance.belongsTo(Paiement, { foreignKey: 'paiementId', as: 'paiement' });
Paiement.hasOne(Quittance, { foreignKey: 'paiementId', as: 'quittance' });

export default Quittance;
