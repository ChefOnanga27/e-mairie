import Contribuable from './Contribuable.js';

export const synchroniserModèlesContribuables = async () => {
  await Contribuable.sync({ alter: true });
  console.log('✅ Modèles du service contribuables synchronisés');
};

export { Contribuable };
