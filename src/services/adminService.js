import pkg from '@prisma/client';
const { OrderStatus } = pkg;
import { prisma } from '../config/prisma.js';
import { userModel } from '../models/userModel.js';

export const adminService = {
    async getDashboardStats() {
        const [totalOrders, totalUsers, revenueAggregate, recentOrders] = await Promise.all([
            prisma.order.count(),
            prisma.user.count(),
            prisma.order.aggregate({
                _sum: { totalAmount: true },
                where: {
                    status: {
                        in: [
                            OrderStatus.PAID,
                            OrderStatus.PROCESSING,
                            OrderStatus.SHIPPED,
                            OrderStatus.DELIVERED
                        ]
                    }
                }
            }),
            prisma.order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true, email: true } } }
            })
        ]);

        return {
            totalOrders,
            totalUsers,
            totalRevenue: Number(revenueAggregate._sum.totalAmount || 0),
            recentOrders: recentOrders.map((order) => ({
                id: order.id,
                orderNumber: order.orderNumber,
                status: order.status,
                totalAmount: Number(order.totalAmount),
                user: order.user,
                createdAt: order.createdAt
            }))
        };
    },

    async listUsers() {
        return userModel.listBasic();
    }
};