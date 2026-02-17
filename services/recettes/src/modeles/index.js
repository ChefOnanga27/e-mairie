import TypeTaxe from './TypeTaxe.js';
import Facture from './Facture.js';

export const synchroniserModèlesRecettes = async () => {
  await TypeTaxe.sync({ alter: true });
  await Facture.sync({ alter: true });
  console.log('✅ Modèles du service recettes synchronisés');
};

export { TypeTaxe, Facture };
