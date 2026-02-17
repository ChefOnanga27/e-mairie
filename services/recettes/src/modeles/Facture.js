import { DataTypes, Model } from 'sequelize';
import sequelize from '../../../../partagé/modeles/configurationBD.js';
import TypeTaxe from './TypeTaxe.js';

class Facture extends Model {
  // Calculer le montant total avec pénalités
  calculerMontantDû() {
    const maintenant = new Date();
    const échéance = new Date(this.dateÉchéance);

    if (maintenant <= échéance || this.statut === 'payé') {
      return parseFloat(this.montantInitial);
    }

    const joursRetard = Math.floor((maintenant - échéance) / (1000 * 60 * 60 * 24));
    const moisRetard = Math.ceil(joursRetard / 30);
    const tauxMensuel = parseFloat(this.tauxPénalité) / 100;
    const montantInitial = parseFloat(this.montantInitial);
    const pénalité = montantInitial * tauxMensuel * moisRetard;

    return Math.round((montantInitial + pénalité) * 100) / 100;
  }
}

Facture.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    numéroFacture: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      comment: 'Numéro de référence unique de la facture',
    },
    contribuableId: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: 'Référence au contribuable (service externe)',
    },
    typeTaxeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: TypeTaxe, key: 'id' },
    },
    période: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Ex: 2024, 2024-T1, 2024-01',
    },
    montantInitial: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    montantPénalités: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    montantTotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    montantPayé: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    tauxPénalité: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 10,
      comment: 'Taux de pénalité appliqué (snapshot du type de taxe)',
    },
    statut: {
      type: DataTypes.ENUM('en_attente', 'partiellement_payé', 'payé', 'en_contentieux', 'annulé'),
      defaultValue: 'en_attente',
    },
    dateÉmission: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    dateÉchéance: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    datePaiement: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    nombreRelances: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    dernièreRelance: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    créePar: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Facture',
    tableName: 'factures',
    indexes: [
      { fields: ['numéro_facture'], unique: true },
      { fields: ['contribuable_id'] },
      { fields: ['statut'] },
      { fields: ['date_échéance'] },
      { fields: ['type_taxe_id'] },
    ],
  }
);

// Association
Facture.belongsTo(TypeTaxe, { foreignKey: 'typeTaxeId', as: 'typeTaxe' });
TypeTaxe.hasMany(Facture, { foreignKey: 'typeTaxeId', as: 'factures' });

export default Facture;
