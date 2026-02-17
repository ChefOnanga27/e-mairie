import Relance from './Relance.js';
import Injonction from './Injonction.js';

export const synchroniserModèlesRecouvrement = async () => {
  await Relance.sync({ alter: true });
  await Injonction.sync({ alter: true });
  console.log('✅ Modèles du service recouvrement synchronisés');
};

export { Relance, Injonction };
