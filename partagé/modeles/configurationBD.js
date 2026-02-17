import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const configurationBD = {
  hote: process.env.BD_HOTE || 'localhost',
  port: parseInt(process.env.BD_PORT) || 5432,
  nom: process.env.BD_NOM || 'recouvrement_municipal',
  utilisateur: process.env.BD_UTILISATEUR || 'admin_mairie',
  motDePasse: process.env.BD_MOT_DE_PASSE || '',
  dialecte: 'postgres',
  journalisation: process.env.BD_JOURNALISATION === 'true' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquérir: 30000,
    attendre: 10000,
  },
  définirDefauts: {
    paranoid: true,        // Soft delete activé
    timestamps: true,      // createdAt, updatedAt automatiques
    underscored: true,     // snake_case dans la BD
    freezeTableName: true, // Pas de pluralisation automatique
  },
};

// Instance Sequelize principale
const sequelize = new Sequelize(
  configurationBD.nom,
  configurationBD.utilisateur,
  configurationBD.motDePasse,
  {
    host: configurationBD.hote,
    port: configurationBD.port,
    dialect: configurationBD.dialecte,
    logging: configurationBD.journalisation,
    pool: configurationBD.pool,
    define: configurationBD.définirDefauts,
  }
);

// Fonction de connexion avec tentatives de reconnexion
export const connecterBaseDeDonnées = async (nomService = 'Service') => {
  let tentatives = 0;
  const maxTentatives = 5;

  while (tentatives < maxTentatives) {
    try {
      await sequelize.authenticate();
      console.log(`✅ [${nomService}] Connexion PostgreSQL établie avec succès`);
      return sequelize;
    } catch (erreur) {
      tentatives++;
      console.error(`❌ [${nomService}] Tentative ${tentatives}/${maxTentatives} échouée:`, erreur.message);

      if (tentatives >= maxTentatives) {
        throw new Error(`Impossible de se connecter à PostgreSQL après ${maxTentatives} tentatives`);
      }

      await new Promise(résoudre => setTimeout(résoudre, 5000));
    }
  }
};

// Synchronisation des modèles (environnement développement uniquement)
export const synchroniserModèles = async (force = false) => {
  if (process.env.NODE_ENV === 'production' && force) {
    throw new Error('La synchronisation forcée est interdite en production ! Utilisez les migrations.');
  }
  await sequelize.sync({ force, alter: !force });
  console.log('✅ Modèles synchronisés avec la base de données');
};

export default sequelize;
export { configurationBD };
