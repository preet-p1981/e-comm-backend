import { StatusCodes } from 'http-status-codes';
import { authService } from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(StatusCodes.CREATED).json(result);
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
  }),

  refresh: asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.body.refreshToken);
    res.json(result);
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.user.id);
    res.status(StatusCodes.NO_CONTENT).send();
  }),

  me: asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
};
