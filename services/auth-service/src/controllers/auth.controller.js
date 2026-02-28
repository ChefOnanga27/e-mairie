import prisma from '../../../../shared/config/prisma.js';
import { hashPassword, comparePassword } from '../../../../shared/utils/encryption.js';
import { generateToken } from '../../../../shared/utils/helpers.js';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../services/jwt.service.js';
import { sendSuccess, sendCreated, sendError } from '../../../../shared/utils/response.js';

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { login, motDePasse, role, agentId, contribuableId } = req.body;

    const existing = await prisma.utilisateur.findUnique({ where: { login } });
    if (existing) {
      return sendError(res, 409, 'Ce login est déjà utilisé');
    }

    const hashed = await hashPassword(motDePasse);
    const utilisateur = await prisma.utilisateur.create({
      data: {
        login,
        motDePasse: hashed,
        role: role || 'CONTRIBUABLE',
        agentId: agentId || null,
        contribuableId: contribuableId || null,
      },
      select: { id: true, login: true, role: true, actif: true, createdAt: true },
    });

    const token = generateAccessToken({ id: utilisateur.id, login: utilisateur.login, role: utilisateur.role });

    return sendCreated(res, { utilisateur, token }, 'Compte créé avec succès');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { login, motDePasse } = req.body;

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { login },
      include: {
        agent: { select: { id: true, nom: true, prenom: true, mairieId: true } },
        contribuable: { select: { id: true, nom: true, prenom: true } },
      },
    });

    if (!utilisateur) {
      return sendError(res, 401, 'Identifiants incorrects');
    }

    if (!utilisateur.actif) {
      return sendError(res, 403, 'Compte désactivé, contactez l\'administrateur');
    }

    const valid = await comparePassword(motDePasse, utilisateur.motDePasse);
    if (!valid) {
      return sendError(res, 401, 'Identifiants incorrects');
    }

    const payload = { id: utilisateur.id, login: utilisateur.login, role: utilisateur.role };
    const token = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { refreshToken, derniereConnexion: new Date() },
    });

    const { motDePasse: _, refreshToken: __, ...userSafe } = utilisateur;

    return sendSuccess(res, { utilisateur: userSafe, token, refreshToken }, 'Connexion réussie');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    await prisma.utilisateur.update({
      where: { id: req.user.id },
      data: { refreshToken: null },
    });
    return sendSuccess(res, {}, 'Déconnexion réussie');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh-token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return sendError(res, 400, 'Refresh token manquant');

    const decoded = verifyToken(token);
    const utilisateur = await prisma.utilisateur.findFirst({
      where: { id: decoded.id, refreshToken: token },
    });

    if (!utilisateur) return sendError(res, 401, 'Refresh token invalide');

    const payload = { id: utilisateur.id, login: utilisateur.login, role: utilisateur.role };
    const newToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    await prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { refreshToken: newRefreshToken },
    });

    return sendSuccess(res, { token: newToken, refreshToken: newRefreshToken }, 'Token renouvelé');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, login: true, role: true, actif: true, derniereConnexion: true, createdAt: true,
        agent: { select: { id: true, nom: true, prenom: true, email: true, mairieId: true } },
        contribuable: { select: { id: true, nom: true, prenom: true, email: true } },
      },
    });

    if (!utilisateur) return sendError(res, 404, 'Utilisateur non trouvé');
    return sendSuccess(res, utilisateur);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { login } = req.body;

    if (login) {
      const exists = await prisma.utilisateur.findFirst({
        where: { login, NOT: { id: req.user.id } },
      });
      if (exists) return sendError(res, 409, 'Ce login est déjà utilisé');
    }

    const updated = await prisma.utilisateur.update({
      where: { id: req.user.id },
      data: { ...(login && { login }) },
      select: { id: true, login: true, role: true, actif: true, updatedAt: true },
    });

    return sendSuccess(res, updated, 'Profil mis à jour');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { login } = req.body;
    const utilisateur = await prisma.utilisateur.findUnique({ where: { login } });

    // Réponse identique que l'utilisateur existe ou non (sécurité)
    if (utilisateur) {
      const token = generateToken(32);
      const expiry = new Date(Date.now() + 3600000); // 1h

      await prisma.utilisateur.update({
        where: { id: utilisateur.id },
        data: { resetToken: token, resetTokenExp: expiry },
      });

      // TODO: Envoyer email via notification-service
      console.log(`Reset token pour ${login}: ${token}`);
    }

    return sendSuccess(res, {}, 'Si ce compte existe, un email de réinitialisation a été envoyé');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password/:token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { motDePasse } = req.body;

    const utilisateur = await prisma.utilisateur.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: { gt: new Date() },
      },
    });

    if (!utilisateur) return sendError(res, 400, 'Token invalide ou expiré');

    const hashed = await hashPassword(motDePasse);
    await prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { motDePasse: hashed, resetToken: null, resetTokenExp: null },
    });

    return sendSuccess(res, {}, 'Mot de passe réinitialisé avec succès');
  } catch (err) {
    next(err);
  }
};

export {
  register,
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
};