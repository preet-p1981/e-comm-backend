import { Router } from 'express';
import { orderController } from '../controllers/orderController.js';

const router = Router();

router.get('/phonepe/verify/:merchantOrderId', orderController.verifyPhonePe);
router.get('/phonepe/redirect', orderController.phonePeRedirect);
router.post('/phonepe/webhook', orderController.phonePeWebhook);

export { router as paymentRoutes };
