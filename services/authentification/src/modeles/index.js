import Utilisateur from './Utilisateur.js';
import JournalAudit from './JournalAudit.js';

// Associations entre les modèles
Utilisateur.hasMany(JournalAudit, { foreignKey: 'utilisateurId', as: 'journauxAudit' });
JournalAudit.belongsTo(Utilisateur, { foreignKey: 'utilisateurId', as: 'utilisateur' });

// Synchroniser les modèles avec la base de données
export const synchroniserModèlesAuth = async () => {
  await Utilisateur.sync({ alter: true });
  await JournalAudit.sync({ alter: true });
  console.log('✅ Modèles du service authentification synchronisés');
};

export { Utilisateur, JournalAudit };
