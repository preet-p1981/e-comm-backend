import { cartService } from '../services/cartService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const cartController = {
  getCart: asyncHandler(async (req, res) => {
    const cart = await cartService.getCart(req.user.id);
    res.json(cart);
  }),
  addItem: asyncHandler(async (req, res) => {
    const cart = await cartService.addItem(req.user.id, req.body);
    res.status(201).json(cart);
  }),
  updateItem: asyncHandler(async (req, res) => {
    const cart = await cartService.updateItem(req.user.id, req.params.itemId, req.body);
    res.json(cart);
  }),
  removeItem: asyncHandler(async (req, res) => {
    const cart = await cartService.removeItem(req.user.id, req.params.itemId);
    res.json(cart);
  }),
  clearCart: asyncHandler(async (req, res) => {
    const cart = await cartService.clearCart(req.user.id);
    res.json(cart);
  })
};
