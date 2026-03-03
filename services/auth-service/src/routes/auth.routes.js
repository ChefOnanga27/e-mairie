import express from 'express';
const router = express.Router();
import * as controller from '../controllers/auth.controller.js';
import { authenticate } from '../../../../shared/middleware/auth.js';

// Routes publiques
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password/:token', controller.resetPassword);
router.post('/refresh-token', controller.refreshToken);

// Routes protégées
router.post('/logout', authenticate, controller.logout);
router.get('/profile', authenticate, controller.getProfile);
router.put('/profile', authenticate, controller.updateProfile);

export default router;