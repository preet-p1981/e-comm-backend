import { prisma } from '../config/prisma.js';

export const productInclude = {
  category: true,
  images: { orderBy: { sortOrder: 'asc' } }
};

export const productModel = {
  findById: (id) => prisma.product.findUnique({ where: { id }, include: productInclude }),
  findBySlug: (slug) => prisma.product.findUnique({ where: { slug }, include: productInclude }),
  create: (data) => prisma.product.create({ data, include: productInclude }),
  update: (id, data) => prisma.product.update({ where: { id }, data, include: productInclude }),
  delete: (id) => prisma.product.delete({ where: { id } })
};
