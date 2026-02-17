import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../../partagé/modeles/configurationBD.js';

class Contribuable extends Model {}

Contribuable.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    numéroIdentifiant: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: { name: 'contribuable_identifiant_unique', msg: 'Cet identifiant existe déjà' },
      comment: 'NIF ou identifiant communal unique',
    },
    catégorie: {
      type: DataTypes.ENUM('particulier', 'entreprise', 'locataire', 'association'),
      allowNull: false,
      defaultValue: 'particulier',
    },
    // Informations personnelles (particuliers)
    nom: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    prénom: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Informations entreprise
    raisonSociale: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: 'Nom de l\'entreprise ou association',
    },
    numéroSIRE: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Numéro d\'enregistrement légal de l\'entreprise',
    },
    // Coordonnées
    adresse: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: { notEmpty: true },
    },
    commune: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    quartier: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    téléphone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: { notEmpty: true },
    },
    téléphoneAlternatif: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: { isEmail: { msg: 'Format email invalide' } },
    },
    // Informations supplémentaires
    pièceIdentitéType: {
      type: DataTypes.ENUM('CNI', 'passeport', 'permis', 'autre'),
      allowNull: true,
    },
    pièceIdentitéNuméro: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    // Statut
    estActif: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    noteInterne: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notes internes réservées aux agents',
    },
    // Métadonnées
    créePar: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'ID de l\'agent qui a créé le profil',
    },
  },
  {
    sequelize,
    modelName: 'Contribuable',
    tableName: 'contribuables',
    indexes: [
      { fields: ['numéro_identifiant'], unique: true },
      { fields: ['catégorie'] },
      { fields: ['commune'] },
      { fields: ['téléphone'] },
      { fields: ['est_actif'] },
    ],
  }
);

export default Contribuable;
