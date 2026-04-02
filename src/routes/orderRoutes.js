import { Router } from 'express';
import { orderController } from '../controllers/orderController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { checkoutSchema, orderStatusSchema } from '../validators/orderValidators.js';

const router = Router();

router.post('/checkout', authenticate, validate(checkoutSchema), orderController.checkout);
router.get('/my-orders', authenticate, orderController.myOrders);
router.get('/admin/all', authenticate, authorize('ADMIN'), orderController.allOrders);
router.patch('/admin/:orderId/status', authenticate, authorize('ADMIN'), validate(orderStatusSchema), orderController.updateStatus);

export { router as orderRoutes };
