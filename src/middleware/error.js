export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const notFound = (req, res, next) => {
  next(new AppError(`Resource not found on path ${req.originalUrl}`, 404));
};

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  let statusCode = err.statusCode || 500;

  if (err.name === 'CastError') {
    error.message = `Invalid format for field: ${err.path}`;
    statusCode = 400;
  }

  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    statusCode = 400;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    error.message = `${field} already exists`;
    statusCode = 409;
  }

  res.status(statusCode).json({
    success: false,
    error: error.message || 'Internal server error'
  });
};
