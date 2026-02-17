import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../../partagé/modeles/configurationBD.js';

class Paiement extends Model {}

Paiement.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    référencePaiement: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Référence unique de transaction',
    },
    factureId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Référence à la facture (service externe)',
    },
    contribuableId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    montant: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    canal: {
      type: DataTypes.ENUM('mobile_money', 'virement_bancaire', 'guichet', 'chèque'),
      allowNull: false,
    },
    statut: {
      type: DataTypes.ENUM('en_cours', 'validé', 'rejeté', 'remboursé', 'en_attente_confirmation'),
      defaultValue: 'en_cours',
    },
    // Informations spécifiques Mobile Money
    numéroMobileMoney: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    opérateur: {
      type: DataTypes.ENUM('orange', 'mtn', 'moov', 'wave', 'autre'),
      allowNull: true,
    },
    transactionIdExterne: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'ID de transaction fourni par l\'opérateur externe',
    },
    // Informations spécifiques virement bancaire
    nomBanque: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    référenceVirement: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Informations spécifiques guichet
    agentId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Agent de caisse ayant enregistré le paiement',
    },
    pointEncaissement: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Dates
    dateInitiation: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    dateConfirmation: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Métadonnées
    motifRejet: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    donnéesBrutes: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Réponse brute de l\'API de paiement externe',
    },
  },
  {
    sequelize,
    modelName: 'Paiement',
    tableName: 'paiements',
    indexes: [
      { fields: ['référence_paiement'], unique: true },
      { fields: ['facture_id'] },
      { fields: ['contribuable_id'] },
      { fields: ['statut'] },
      { fields: ['canal'] },
      { fields: ['date_initiation'] },
    ],
  }
);

export default Paiement;
