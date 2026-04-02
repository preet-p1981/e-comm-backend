import { StatusCodes } from 'http-status-codes';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

const serializeCart = (cart) => {
  const items = cart.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: {
      id: item.product.id,
      name: item.product.name,
      slug: item.product.slug,
      price: Number(item.product.price),
      stock: item.product.stock,
      image: item.product.images[0]?.url || null
    },
    lineTotal: Number(item.product.price) * item.quantity
  }));

  return {
    id: cart.id,
    items,
    totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
    subtotal: items.reduce((acc, item) => acc + item.lineTotal, 0)
  };
};

const getCartOrCreate = async (userId) => prisma.cart.upsert({
  where: { userId },
  update: {},
  create: { userId },
  include: { items: { include: { product: { include: { images: true } } } } }
});

export const cartService = {
  async getCart(userId) {
    const cart = await getCartOrCreate(userId);
    return serializeCart(cart);
  },

  async addItem(userId, payload) {
    const cart = await getCartOrCreate(userId);
    const product = await prisma.product.findUnique({ where: { id: payload.productId } });
    if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
    if (product.stock < payload.quantity) throw new ApiError(StatusCodes.BAD_REQUEST, 'Insufficient stock');

    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: payload.productId } },
      update: { quantity: { increment: payload.quantity } },
      create: { cartId: cart.id, productId: payload.productId, quantity: payload.quantity }
    });

    return this.getCart(userId);
  },

  async updateItem(userId, itemId, payload) {
    const cart = await getCartOrCreate(userId);
    const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id }, include: { product: true } });
    if (!item) throw new ApiError(StatusCodes.NOT_FOUND, 'Cart item not found');
    if (item.product.stock < payload.quantity) throw new ApiError(StatusCodes.BAD_REQUEST, 'Insufficient stock');

    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: payload.quantity } });
    return this.getCart(userId);
  },

  async removeItem(userId, itemId) {
    const cart = await getCartOrCreate(userId);
    const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw new ApiError(StatusCodes.NOT_FOUND, 'Cart item not found');
    await prisma.cartItem.delete({ where: { id: itemId } });
    return this.getCart(userId);
  },

  async clearCart(userId) {
    const cart = await getCartOrCreate(userId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getCart(userId);
  }
};
