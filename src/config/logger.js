import winston from 'winston';
import { env } from './env.js';

const { combine, timestamp, errors, printf, colorize, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp: time, stack }) => `${time} ${level}: ${stack || message}`);

export const logger = winston.createLogger({
  level: env.nodeEnv === 'production' ? 'info' : 'debug',
  format: combine(timestamp(), errors({ stack: true }), json()),
  defaultMeta: { service: 'ecommerce-backend' },
  transports: [
    new winston.transports.Console({
      format: env.nodeEnv === 'production'
        ? combine(timestamp(), errors({ stack: true }), json())
        : combine(colorize(), timestamp(), errors({ stack: true }), consoleFormat)
    })
  ]
});
