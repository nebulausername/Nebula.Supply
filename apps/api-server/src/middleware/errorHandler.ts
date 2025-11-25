import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  details?: any;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log Error
  logger.error('API Error:', {
    message: err.message,
    stack: err.stack,
    statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Don't expose internal errors in production
  const message = isDevelopment || err.isOperational
    ? err.message
    : 'Interner Server-Fehler';

  // Send Error Response
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(isDevelopment && { stack: err.stack }),
    ...(err.code && { code: err.code }),
    ...((err as ApiError).details && { details: (err as ApiError).details }),
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};

// Helper function to create operational errors
export const createError = (
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): ApiError => {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  if (code) error.code = code;
  if (details) error.details = details;
  return error;
};

// Async Error Wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
