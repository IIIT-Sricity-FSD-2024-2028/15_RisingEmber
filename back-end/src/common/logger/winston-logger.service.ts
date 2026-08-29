import * as winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, errors, colorize, json } = winston.format;

// Custom format for console output (human-readable)
const consoleFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  let log = `[${ts}] ${level.toUpperCase()}: ${message}`;
  if (stack) log += `\n${stack}`;
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return log + metaStr;
});

// Shared daily rotate options
const dailyRotateBase = {
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '14d', // keep 14 days of logs
};

// Application general log transport (info + above)
const appFileTransport = new winston.transports.DailyRotateFile({
  ...dailyRotateBase,
  filename: 'logs/application-%DATE%.log',
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), json()),
});

// Error-only log transport
const errorFileTransport = new winston.transports.DailyRotateFile({
  ...dailyRotateBase,
  filename: 'logs/error-%DATE%.log',
  level: 'error',
  format: combine(timestamp(), errors({ stack: true }), json()),
});

// HTTP request log transport
const httpFileTransport = new winston.transports.DailyRotateFile({
  ...dailyRotateBase,
  filename: 'logs/http-%DATE%.log',
  level: 'http',
  format: combine(timestamp(), json()),
});

// Audit log transport for sensitive routes
const auditFileTransport = new winston.transports.DailyRotateFile({
  ...dailyRotateBase,
  filename: 'logs/audit-%DATE%.log',
  level: 'info',
  format: combine(timestamp(), json()),
});

// Main application logger
export const appLogger = winston.createLogger({
  levels: winston.config.npm.levels,
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat,
      ),
    }),
    appFileTransport,
    errorFileTransport,
  ],
  exitOnError: false,
});

// HTTP request logger (used by Morgan middleware)
export const httpLogger = winston.createLogger({
  levels: winston.config.npm.levels,
  level: 'http',
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat,
      ),
    }),
    httpFileTransport,
  ],
  exitOnError: false,
});

// Audit logger for sensitive routes (bookings, cases, awards)
export const auditLogger = winston.createLogger({
  levels: winston.config.npm.levels,
  level: 'info',
  transports: [
    new winston.transports.Console({
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat,
      ),
    }),
    auditFileTransport,
  ],
  exitOnError: false,
});

// Stream interface for Morgan HTTP logger
export const morganStream = {
  write: (message: string) => {
    httpLogger.http(message.trim());
  },
};
