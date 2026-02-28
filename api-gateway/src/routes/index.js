import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { verifyToken } from '../middleware/auth.js';
import { defaultLimiter, authLimiter } from '../middleware/rateLimit.js';
import serviceRoutes from '../config/routes.js';

const router = express.Router();

// Rate limiting global
router.use(defaultLimiter);

// Vérification JWT
router.use(verifyToken);

// Rate limiting spécifique pour l'auth
router.use('/api/auth/login', authLimiter);
router.use('/api/auth/register', authLimiter);

// Proxy vers chaque service
Object.entries(serviceRoutes).forEach(([path, target]) => {
  router.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      on: {
        error: (err, req, res) => {
          console.error(`[Proxy Error] ${path} -> ${target}:`, err.message);
          res.status(503).json({
            success: false,
            message: `Service indisponible: ${path}`,
          });
        },
      },
      logger: console,
    })
  );
});

export default router;