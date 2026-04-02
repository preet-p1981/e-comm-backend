import { StatusCodes } from 'http-status-codes';
import { prisma } from '../config/prisma.js';
import { productModel } from '../models/productModel.js';
import { ApiError } from '../utils/ApiError.js';
import { parsePagination, slugify } from '../utils/helpers.js';
import { destroyCloudinaryAsset, uploadBufferToCloudinary } from './cloudinaryService.js';

const serializeProduct = (product) => ({
  ...product,
  price: Number(product.price),
  images: product.images || []
});

export const productService = {
  async list(query) {
    const { page, limit, skip } = parsePagination(query);
    const where = {
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { sku: { contains: query.search, mode: 'insensitive' } }
        ]
      }),
      ...(query.category && { category: { slug: query.category } }),
      ...(query.featured === 'true' && { isFeatured: true })
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, images: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    return {
      items: items.map(serializeProduct),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  async getBySlug(slug) {
    const product = await productModel.findBySlug(slug);
    if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
    return serializeProduct(product);
  },

  async getById(id) {
    const product = await productModel.findById(id);
    if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
    return serializeProduct(product);
  },

  async create(payload, files, userId) {
    const category = await prisma.category.findUnique({ where: { id: payload.categoryId } });
    if (!category) throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid category');

    const uploadedImages = [];
    if (files?.length) {
      for (let index = 0; index < files.length; index += 1) {
        const result = await uploadBufferToCloudinary(files[index].buffer);
        uploadedImages.push({ url: result.secure_url, publicId: result.public_id, altText: payload.name, sortOrder: index });
      }
    }

    const product = await productModel.create({
      name: payload.name,
      slug: slugify(payload.name),
      description: payload.description,
      price: payload.price,
      stock: payload.stock,
      sku: payload.sku,
      isFeatured: payload.isFeatured ?? false,
      categoryId: payload.categoryId,
      createdById: userId,
      images: uploadedImages.length ? { create: uploadedImages } : undefined
    });

    return serializeProduct(product);
  },

  async update(id, payload, files) {
    const existingProduct = await productModel.findById(id);
    if (!existingProduct) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');

    let images = undefined;
    if (files?.length) {
      for (const image of existingProduct.images) {
        if (image.publicId && !image.publicId.startsWith('seed-')) {
          await destroyCloudinaryAsset(image.publicId);
        }
      }

      const uploadedImages = [];
      for (let index = 0; index < files.length; index += 1) {
        const result = await uploadBufferToCloudinary(files[index].buffer);
        uploadedImages.push({ url: result.secure_url, publicId: result.public_id, altText: payload.name || existingProduct.name, sortOrder: index });
      }
      images = { deleteMany: {}, create: uploadedImages };
    }

    const product = await productModel.update(id, {
      ...(payload.name && { name: payload.name, slug: slugify(payload.name) }),
      ...(payload.description && { description: payload.description }),
      ...(payload.price !== undefined && { price: payload.price }),
      ...(payload.stock !== undefined && { stock: payload.stock }),
      ...(payload.sku && { sku: payload.sku }),
      ...(payload.categoryId && { categoryId: payload.categoryId }),
      ...(payload.isFeatured !== undefined && { isFeatured: payload.isFeatured }),
      ...(images && { images })
    });

    return serializeProduct(product);
  },

  async remove(id) {
    const product = await productModel.findById(id);
    if (!product) throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');

    for (const image of product.images) {
      if (image.publicId && !image.publicId.startsWith('seed-')) {
        await destroyCloudinaryAsset(image.publicId);
      }
    }

    await productModel.delete(id);
  },

  async listCategories() {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
  },

  async createCategory(payload) {
    return prisma.category.create({
      data: { name: payload.name, slug: slugify(payload.name), description: payload.description }
    });
  }
};
