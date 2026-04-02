import { z } from 'zod';

export const checkoutSchema = z.object({
  shippingName: z.string().min(2),
  shippingEmail: z.string().email(),
  shippingPhone: z.string().min(8),
  shippingAddress1: z.string().min(5),
  shippingAddress2: z.string().optional(),
  shippingCity: z.string().min(2),
  shippingState: z.string().min(2),
  shippingPostal: z.string().min(3),
  shippingCountry: z.string().min(2),
  notes: z.string().optional()
});

export const orderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED'])
});
