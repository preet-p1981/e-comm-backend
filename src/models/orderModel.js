import { prisma } from '../config/prisma.js';

export const orderInclude = {
  orderItems: true,
  payments: true,
  user: { select: { id: true, name: true, email: true } }
};

export const orderModel = {
  findById: (id) => prisma.order.findUnique({ where: { id }, include: orderInclude }),
  findByOrderNumber: (orderNumber) => prisma.order.findUnique({ where: { orderNumber }, include: orderInclude }),
  listAll: () => prisma.order.findMany({ include: orderInclude, orderBy: { createdAt: 'desc' } }),
  listByUser: (userId) => prisma.order.findMany({ where: { userId }, include: { orderItems: true, payments: true }, orderBy: { createdAt: 'desc' } })
};
