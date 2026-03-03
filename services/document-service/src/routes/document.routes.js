import express from 'express';
const router = express.Router();
import * as ctrl from '../controllers/document.controller.js';
import { upload } from '../services/upload.service.js';
import { authenticate, authorize } from '../../../../shared/middleware/auth.js';

// Types de documents
router.get('/types', ctrl.getAllTypes);
router.post('/types', authenticate, authorize('SUPER_ADMIN', 'ADMIN_MAIRIE'), ctrl.createType);

// Documents
router.get('/', authenticate, ctrl.getAll);
router.get('/:id', authenticate, ctrl.getById);
router.post('/', authenticate, upload.single('fichier'), ctrl.create);
router.put('/:id', authenticate, upload.single('fichier'), ctrl.update);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN_MAIRIE'), ctrl.remove);

export default router;