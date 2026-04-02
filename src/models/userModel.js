import { prisma } from '../config/prisma.js';

export const userModel = {
  findByEmail: (email) => prisma.user.findUnique({ where: { email } }),
  findById: (id) => prisma.user.findUnique({ where: { id } }),
  create: (data) => prisma.user.create({ data }),
  updateById: (id, data) => prisma.user.update({ where: { id }, data }),
  listBasic: () => prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } })
};
