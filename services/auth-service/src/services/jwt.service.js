import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Génère un access token JWT
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Génère un refresh token JWT
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

/**
 * Vérifie un token JWT
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Décode un token sans vérification
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

export { generateAccessToken, generateRefreshToken, verifyToken, decodeToken };