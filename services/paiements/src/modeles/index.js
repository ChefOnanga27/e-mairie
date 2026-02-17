import Paiement from './Paiement.js';
import Quittance from './Quittance.js';

export const synchroniserModèlesPaiements = async () => {
  await Paiement.sync({ alter: true });
  await Quittance.sync({ alter: true });
  console.log('✅ Modèles du service paiements synchronisés');
};

export { Paiement, Quittance };
