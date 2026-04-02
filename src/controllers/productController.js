import { StatusCodes } from 'http-status-codes';
import { productService } from '../services/productService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const productController = {
  list: asyncHandler(async (req, res) => {
    const data = await productService.list(req.query);
    res.json(data);
  }),
  getBySlug: asyncHandler(async (req, res) => {
    const product = await productService.getBySlug(req.params.slug);
    res.json(product);
  }),
  listCategories: asyncHandler(async (req, res) => {
    const categories = await productService.listCategories();
    res.json(categories);
  }),
  createCategory: asyncHandler(async (req, res) => {
    const category = await productService.createCategory(req.body);
    res.status(StatusCodes.CREATED).json(category);
  }),
  create: asyncHandler(async (req, res) => {
    const product = await productService.create(req.body, req.files, req.user.id);
    res.status(StatusCodes.CREATED).json(product);
  }),
  update: asyncHandler(async (req, res) => {
    const product = await productService.update(req.params.id, req.body, req.files);
    res.json(product);
  }),
  remove: asyncHandler(async (req, res) => {
    await productService.remove(req.params.id);
    res.status(StatusCodes.NO_CONTENT).send();
  })
};
