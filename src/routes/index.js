import { Router } from 'express';
import { adminRoutes } from './adminRoutes.js';
import { authRoutes } from './authRoutes.js';
import { cartRoutes } from './cartRoutes.js';
import { orderRoutes } from './orderRoutes.js';
import { paymentRoutes } from './paymentRoutes.js';
import { productRoutes } from './productRoutes.js';

export const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
