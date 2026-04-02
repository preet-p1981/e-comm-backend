import { env } from '../config/env.js';
import { orderService } from '../services/orderService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const orderController = {
  checkout: asyncHandler(async (req, res) => {
    const idempotencyKey = req.headers['idempotency-key'] || null;
    const result = await orderService.checkout(req.user.id, req.body, idempotencyKey);
    res.status(201).json(result);
  }),
  myOrders: asyncHandler(async (req, res) => {
    const orders = await orderService.getMyOrders(req.user.id);
    res.json(orders);
  }),
  allOrders: asyncHandler(async (req, res) => {
    const orders = await orderService.getAllOrders();
    res.json(orders);
  }),
  updateStatus: asyncHandler(async (req, res) => {
    const order = await orderService.updateOrderStatus(req.params.orderId, req.body.status);
    res.json(order);
  }),
  verifyPhonePe: asyncHandler(async (req, res) => {
    const order = await orderService.verifyPhonePePayment(req.params.merchantOrderId);
    res.json(order);
  }),
  phonePeRedirect: asyncHandler(async (req, res) => {
    const merchantOrderId = req.query.merchantOrderId;
    try {
      await orderService.verifyPhonePePayment(merchantOrderId, req.query);
      res.redirect(`${env.phonepeFrontendSuccess}&merchantOrderId=${merchantOrderId}`);
    } catch (error) {
      res.redirect(`${env.phonepeFrontendFailure}&merchantOrderId=${merchantOrderId}`);
    }
  }),
  phonePeWebhook: asyncHandler(async (req, res) => {
    const merchantOrderId = req.body.merchantOrderId || req.body.orderId || req.query.merchantOrderId;
    if (merchantOrderId) {
      await orderService.verifyPhonePePayment(merchantOrderId, req.body);
    }
    res.json({ received: true });
  })
};
