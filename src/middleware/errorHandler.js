import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;

  if (err instanceof ZodError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: 'Validation failed',
      errors: err.flatten()
    });
  }

  logger.error(err);

  return res.status(statusCode).json({
    message: err.message || 'Something went wrong',
    details: err.details || null,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
