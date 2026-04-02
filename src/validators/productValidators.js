import { z } from 'zod';

export const productCreateSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(10),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  sku: z.string().min(3),
  categoryId: z.string().min(1),
  isFeatured: z.union([z.boolean(), z.string()]).optional().transform((value) => value === true || value === 'true')
});

export const productUpdateSchema = productCreateSchema.partial();

export const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional()
});
