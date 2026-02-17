import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../../partagé/modeles/configurationBD.js';

class Injonction extends Model {}

Injonction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    numéroInjonction: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    contribuableId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    factureIds: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      allowNull: false,
      comment: 'Liste des factures concernées par l\'injonction',
    },
    montantTotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    statut: {
      type: DataTypes.ENUM(
        'préparée', 'notifiée', 'en_cours_judiciaire', 'exécutée', 'classée', 'annulée'
      ),
      defaultValue: 'préparée',
    },
    dateÉmission: {
      type: DataTypes.DATEONLY,
      defaultValue: DataTypes.NOW,
    },
    dateNotification: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    délaiRéponse: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      comment: 'Délai en jours pour répondre à l\'injonction',
    },
    tribunalCompétent: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    numéroAffaireJudiciaire: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    créePar: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    validéPar: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Responsable ayant validé l\'envoi de l\'injonction',
    },
  },
  {
    sequelize,
    modelName: 'Injonction',
    tableName: 'injonctions',
    indexes: [
      { fields: ['numéro_injonction'], unique: true },
      { fields: ['contribuable_id'] },
      { fields: ['statut'] },
    ],
  }
);

export default Injonction;
