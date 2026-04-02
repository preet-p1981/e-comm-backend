//import { OrderStatus, PaymentStatus } from '@prisma/client';
import pkg from '@prisma/client';
const { OrderStatus, PaymentStatus } = pkg;
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../config/prisma.js';
import { orderModel } from '../models/orderModel.js';
import { ApiError } from '../utils/ApiError.js';
import { generateOrderNumber } from '../utils/helpers.js';
import { phonepeService } from './phonepeService.js';

const serializeOrder = (order) => ({
  ...order,
  subtotal: Number(order.subtotal),
  taxAmount: Number(order.taxAmount),
  shippingAmount: Number(order.shippingAmount),
  totalAmount: Number(order.totalAmount),
  orderItems: order.orderItems.map((item) => ({
    ...item,
    unitPrice: Number(item.unitPrice),
    totalPrice: Number(item.totalPrice)
  })),
  payments: order.payments?.map((payment) => ({ ...payment, amount: Number(payment.amount) })) || []
});

const resolveOrderStatus = (phonePeState) => {
  if (phonePeState === 'COMPLETED') return { orderStatus: OrderStatus.PAID, paymentStatus: PaymentStatus.SUCCESS };
  if (phonePeState === 'FAILED') return { orderStatus: OrderStatus.FAILED, paymentStatus: PaymentStatus.FAILED };
  return { orderStatus: OrderStatus.PENDING, paymentStatus: PaymentStatus.PENDING };
};

export const orderService = {
  async checkout(userId, payload, idempotencyKey) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } }
    });

    if (!cart || !cart.items.length) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Cart is empty');
    }

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Insufficient stock for ${item.product.name}`);
      }
    }

    const cartSnapshot = cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    }));
    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
    const taxAmount = Number((subtotal * 0.18).toFixed(2));
    const shippingAmount = subtotal >= 1000 ? 0 : 99;
    const totalAmount = Number((subtotal + taxAmount + shippingAmount).toFixed(2));
    const orderNumber = generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          taxAmount,
          shippingAmount,
          totalAmount,
          shippingName: payload.shippingName,
          shippingEmail: payload.shippingEmail,
          shippingPhone: payload.shippingPhone,
          shippingAddress1: payload.shippingAddress1,
          shippingAddress2: payload.shippingAddress2,
          shippingCity: payload.shippingCity,
          shippingState: payload.shippingState,
          shippingPostal: payload.shippingPostal,
          shippingCountry: payload.shippingCountry,
          notes: payload.notes,
          orderItems: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productSku: item.product.sku,
              unitPrice: item.product.price,
              quantity: item.quantity,
              totalPrice: Number(item.product.price) * item.quantity
            }))
          },
          payments: {
            create: {
              merchantOrderId: orderNumber,
              amount: totalAmount,
              idempotencyKey,
              currency: 'INR'
            }
          }
        },
        include: { orderItems: true, payments: true }
      });

      for (const item of cart.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return createdOrder;
    });

    try {
      const paymentSession = await phonepeService.createPaymentSession({
        merchantOrderId: orderNumber,
        amountInPaisa: Math.round(totalAmount * 100)
      });

      await prisma.payment.update({
        where: { merchantOrderId: orderNumber },
        data: {
          redirectUrl: paymentSession.redirectUrl,
          providerOrderId: paymentSession.orderId,
          responsePayload: paymentSession
        }
      });

      return {
        order: serializeOrder(order),
        payment: paymentSession
      };
    } catch (error) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({ where: { id: order.id }, data: { status: OrderStatus.FAILED } });
        await tx.payment.update({
          where: { merchantOrderId: orderNumber },
          data: {
            status: PaymentStatus.FAILED,
            responsePayload: { message: error.message }
          }
        });

        for (const item of cartSnapshot) {
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
          await tx.cartItem.upsert({
            where: { cartId_productId: { cartId: cart.id, productId: item.productId } },
            update: { quantity: item.quantity },
            create: { cartId: cart.id, productId: item.productId, quantity: item.quantity }
          });
        }
      });

      throw error;
    }
  },

  async verifyPhonePePayment(merchantOrderId, callbackPayload = null) {
    const payment = await prisma.payment.findUnique({
      where: { merchantOrderId },
      include: { order: { include: { orderItems: true, payments: true } } }
    });

    if (!payment) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Payment not found');
    }

    const statusResponse = await phonepeService.getPaymentStatus(merchantOrderId);
    const { orderStatus, paymentStatus } = resolveOrderStatus(statusResponse.state);
    const latestPaymentDetail = statusResponse.paymentDetails?.[0];

    const updatedPayment = await prisma.payment.update({
      where: { merchantOrderId },
      data: {
        status: paymentStatus,
        providerOrderId: statusResponse.orderId || payment.providerOrderId,
        providerTransactionId: latestPaymentDetail?.transactionId || payment.providerTransactionId,
        responsePayload: statusResponse,
        ...(callbackPayload ? { callbackPayload } : {})
      },
      include: { order: { include: { orderItems: true, payments: true } } }
    });

    await prisma.order.update({ where: { id: payment.orderId }, data: { status: orderStatus } });

    return serializeOrder({ ...updatedPayment.order, payments: updatedPayment.order.payments.map((entry) => entry.id === updatedPayment.id ? updatedPayment : entry) });
  },

  async getMyOrders(userId) {
    const orders = await orderModel.listByUser(userId);
    return orders.map(serializeOrder);
  },

  async getAllOrders() {
    const orders = await orderModel.listAll();
    return orders.map(serializeOrder);
  },

  async updateOrderStatus(orderId, status) {
    const order = await orderModel.findById(orderId);
    if (!order) throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { orderItems: true, payments: true, user: { select: { id: true, name: true, email: true } } }
    });
    return serializeOrder(updatedOrder);
  }
};
