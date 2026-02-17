import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../../../../partagé/modeles/configurationBD.js';
import { RÔLES } from '../../../../partagé/middlewares/authentification.js';

class Utilisateur extends Model {
  // Vérifier le mot de passe
  async vérifierMotDePasse(motDePasseBrut) {
    return bcrypt.compare(motDePasseBrut, this.motDePasseHaché);
  }

  // Retourner l'objet sans données sensibles
  toJSON() {
    const valeurs = { ...this.get() };
    delete valeurs.motDePasseHaché;
    delete valeurs.tokenRéinitialisation;
    delete valeurs.tokenRéinitialisationExpiration;
    return valeurs;
  }
}

Utilisateur.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true, len: [2, 100] },
    },
    prénom: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true, len: [2, 100] },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: { name: 'utilisateur_email_unique', msg: 'Cet email est déjà utilisé' },
      validate: { isEmail: { msg: 'Format email invalide' } },
    },
    téléphone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        est(valeur) {
          if (valeur && !/^\+?[\d\s\-()]{8,20}$/.test(valeur)) {
            throw new Error('Numéro de téléphone invalide');
          }
        },
      },
    },
    motDePasseHaché: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    rôle: {
      type: DataTypes.ENUM(...Object.values(RÔLES)),
      allowNull: false,
      defaultValue: RÔLES.CITOYEN,
    },
    estActif: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    estVérifié: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    dernièreConnexion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tentativesConnexion: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    compteBloquéJusqu: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tokenRéinitialisation: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    tokenRéinitialisationExpiration: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    serviceId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Identifiant du département ou service municipal',
    },
  },
  {
    sequelize,
    modelName: 'Utilisateur',
    tableName: 'utilisateurs',
    indexes: [
      { fields: ['email'] },
      { fields: ['rôle'] },
      { fields: ['est_actif'] },
    ],
    hooks: {
      // Hacher le mot de passe avant la création/mise à jour
      beforeCreate: async (utilisateur) => {
        if (utilisateur.motDePasseHaché) {
          const sel = await bcrypt.genSalt(12);
          utilisateur.motDePasseHaché = await bcrypt.hash(utilisateur.motDePasseHaché, sel);
        }
      },
      beforeUpdate: async (utilisateur) => {
        if (utilisateur.changed('motDePasseHaché')) {
          const sel = await bcrypt.genSalt(12);
          utilisateur.motDePasseHaché = await bcrypt.hash(utilisateur.motDePasseHaché, sel);
        }
      },
    },
  }
);

export default Utilisateur;
