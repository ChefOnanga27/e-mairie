import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

/**
 * Hache un mot de passe
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Vérifie un mot de passe contre son hash
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Chiffre une valeur avec AES-256-CBC
 */
const encrypt = (text) => {
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-32-char-key-please-change', 'utf8').slice(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Déchiffre une valeur AES-256-CBC
 */
const decrypt = (encryptedText) => {
  const [ivHex, encrypted] = encryptedText.split(':');
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-32-char-key-please-change', 'utf8').slice(0, 32);
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export { hashPassword, comparePassword, encrypt, decrypt }; 