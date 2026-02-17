import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../../partagé/modeles/configurationBD.js';

class TypeTaxe extends Model {}

TypeTaxe.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: 'Code unique de la taxe (ex: TM001, IL002)',
    },
    libellé: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: { notEmpty: true },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    catégorie: {
      type: DataTypes.ENUM(
        'taxe_municipale',
        'impôt_local',
        'loyer',
        'redevance',
        'injonction',
        'frais_service'
      ),
      allowNull: false,
    },
    typeMontant: {
      type: DataTypes.ENUM('fixe', 'pourcentage', 'calculé'),
      allowNull: false,
      defaultValue: 'fixe',
    },
    montantBase: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Montant de base en FCFA',
    },
    tauxPénalité: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 10,
      comment: 'Taux de pénalité en pourcentage par mois de retard',
    },
    délaiGrâce: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Nombre de jours de grâce avant pénalité',
    },
    fréquence: {
      type: DataTypes.ENUM('unique', 'mensuel', 'trimestriel', 'semestriel', 'annuel'),
      defaultValue: 'annuel',
    },
    estActif: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    baseJuridique: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Référence légale ou délibération du conseil municipal',
    },
    créePar: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'TypeTaxe',
    tableName: 'types_taxes',
    indexes: [
      { fields: ['code'], unique: true },
      { fields: ['catégorie'] },
      { fields: ['est_actif'] },
    ],
  }
);

export default TypeTaxe;
