import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { userModel } from '../models/userModel.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

const tokenPayload = (user) => ({ sub: user.id, role: user.role, email: user.email });

const buildAuthResponse = async (user) => {
  const accessToken = signAccessToken(tokenPayload(user));
  const refreshToken = signRefreshToken(tokenPayload(user));
  const refreshTokenHash = await bcrypt.hash(refreshToken, env.bcryptSaltRounds);

  await userModel.updateById(user.id, { refreshTokenHash });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken
  };
};

const ensureCart = async (userId) => {
  await prisma.cart.upsert({ where: { userId }, update: {}, create: { userId } });
};

export const authService = {
  async register(payload) {
    const existingUser = await userModel.findByEmail(payload.email);
    if (existingUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already registered');
    }

    const password = await bcrypt.hash(payload.password, env.bcryptSaltRounds);
    const user = await userModel.create({
      name: payload.name,
      email: payload.email,
      password,
      phone: payload.phone
    });

    await ensureCart(user.id);
    return buildAuthResponse(user);
  },

  async login(payload) {
    const user = await userModel.findByEmail(payload.email);
    if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
    }

    await ensureCart(user.id);
    return buildAuthResponse(user);
  },

  async refresh(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await userModel.findById(decoded.sub);

    if (!user || !user.refreshTokenHash) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token invalid');
    }

    const isTokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isTokenValid) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token invalid');
    }

    return buildAuthResponse(user);
  },

  async logout(userId) {
    await userModel.updateById(userId, { refreshTokenHash: null });
  }
};
