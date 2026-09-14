import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details === undefined ? {} : { details: err.details }),
      },
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError && err.kind === 'ObjectId') {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Not Found',
      },
    });
    return;
  }

  if (isDuplicateKeyError(err)) {
    res.status(409).json({
      error: {
        code: 'UNIQUE_CONFLICT',
        message: 'Resource already exists',
      },
    });
    return;
  }

  if (err instanceof SyntaxError) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Malformed JSON',
      },
    });
    return;
  }

  logger.error('Unhandled error', err);

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal Server Error',
    },
  });
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 11000;
}
