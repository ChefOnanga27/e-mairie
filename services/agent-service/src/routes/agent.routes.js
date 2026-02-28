import express from 'express';
const router = express.Router();
import * as ctrl from '../controllers/agent.controller.js';
import { authenticate, authorize } from '../../../../shared/middleware/auth.js';

router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getById);
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN_MAIRIE'), ctrl.create);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN_MAIRIE'), ctrl.update);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN_MAIRIE'), ctrl.remove);

export default router; 