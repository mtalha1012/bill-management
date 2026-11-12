import { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import mongoose from 'mongoose';
import { ErrorResponse } from '../types/api.js';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Wraps async handlers so rejected promises reach the error middleware
export const asyncHandler =
  <P = ParamsDictionary, ResBody = unknown, ReqBody = unknown>(
    fn: (
      req: Request<P, ResBody, ReqBody>,
      res: Response<ResBody>,
      next: NextFunction
    ) => Promise<unknown>
  ): RequestHandler<P, ResBody, ReqBody> =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

interface DuplicateKeyError {
  code: 11000;
  keyValue?: Record<string, unknown>;
}

// Mongo duplicate key errors only have a numeric code to check
const isDuplicateKeyError = (err: unknown): err is DuplicateKeyError =>
  typeof err === 'object' &&
  err !== null &&
  'code' in err &&
  (err as { code: unknown }).code === 11000;

export const notFound: RequestHandler = (req, res, next) => {
  next(new AppError(`Resource not found on path ${req.originalUrl}`, 404));
};

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req,
  res: Response<ErrorResponse>,
  next
) => {
  let message = 'Internal server error';
  let statusCode = 500;

  if (err instanceof AppError) {
    message = err.message;
    statusCode = err.statusCode;
  } else if (err instanceof mongoose.Error.CastError) {
    message = `Invalid format for field: ${err.path}`;
    statusCode = 400;
  } else if (err instanceof mongoose.Error.ValidationError) {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    statusCode = 400;
  } else if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    message = `${field} already exists`;
    statusCode = 409;
  } else if (err instanceof Error) {
    message = err.message || message;
    if ('statusCode' in err && typeof err.statusCode === 'number') {
      statusCode = err.statusCode;
    }
  }

  res.status(statusCode).json({
    success: false,
    error: message
  });
};
