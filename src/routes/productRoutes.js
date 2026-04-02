import { Router } from 'express';
import { productController } from '../controllers/productController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { categorySchema, productCreateSchema, productUpdateSchema } from '../validators/productValidators.js';

const router = Router();

/**
 * @openapi
 * /products:
 *   get:
 *     summary: List products with pagination, category filtering, and search.
 */
router.get('/', productController.list);
router.get('/categories', productController.listCategories);
router.get('/:slug', productController.getBySlug);
router.post('/categories', authenticate, authorize('ADMIN'), validate(categorySchema), productController.createCategory);
router.post('/', authenticate, authorize('ADMIN'), upload.array('images', 5), validate(productCreateSchema), productController.create);
router.put('/:id', authenticate, authorize('ADMIN'), upload.array('images', 5), validate(productUpdateSchema), productController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), productController.remove);

export { router as productRoutes };
