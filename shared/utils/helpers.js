import crypto from 'crypto';

/**
 * Génère une référence unique pour les documents/demandes
 * Format: PREFIX-YYYYMMDD-XXXXX
 */
const generateReference = (prefix = 'REF') => {
  const date = new Date();
  const dateStr = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${dateStr}-${random}`;
};

/**
 * Formate un montant en francs CFA
 */
const formatMontant = (montant) => {
  return new Intl.NumberFormat('fr-GA', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(montant);
};

/**
 * Nettoie et normalise un numéro de téléphone gabonais
 */
const normalizePhone = (phone) => {
  if (!phone) return null;
  return phone.replace(/\s+/g, '').replace(/^0/, '+241');
};

/**
 * Vérifie si une valeur est un entier positif valide
 */
const isPositiveInt = (val) => {
  const n = parseInt(val);
  return !isNaN(n) && n > 0 && String(n) === String(val);
};

/**
 * Capitalise la première lettre
 */
const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Calcule la date d'expiration (en jours)
 */
const getExpirationDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

/**
 * Génère un token aléatoire sécurisé
 */
const generateToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

export {
  generateReference,
  formatMontant,
  normalizePhone,
  isPositiveInt,
  capitalize,
  getExpirationDate,
  generateToken,
};