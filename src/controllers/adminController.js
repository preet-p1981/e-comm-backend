import { adminService } from '../services/adminService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const adminController = {
  dashboardStats: asyncHandler(async (req, res) => {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  }),
  listUsers: asyncHandler(async (req, res) => {
    const users = await adminService.listUsers();
    res.json(users);
  })
};
