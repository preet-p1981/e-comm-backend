import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate, authorize('ADMIN'));
router.get('/dashboard', adminController.dashboardStats);
router.get('/users', adminController.listUsers);

export { router as adminRoutes };
