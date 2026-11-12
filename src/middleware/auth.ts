import { Request, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserDocument } from '../models/User.js';
import { getEnv } from '../config/env.js';
import { AppError, asyncHandler } from './error.js';

export const protect: RequestHandler = asyncHandler(async (req, res, next) => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, getEnv('JWT_SECRET'));

    if (typeof decoded === 'string' || typeof decoded.id !== 'string') {
      return next(new AppError('Not authorized, token failed or expired', 401));
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new AppError('User not found for provided token', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new AppError('Not authorized, token failed or expired', 401));
  }
});

// Get the logged in user set by protect
export const getAuthUser = <P, ResBody, ReqBody>(
  req: Request<P, ResBody, ReqBody>
): UserDocument => {
  if (!req.user) {
    throw new AppError('Not authorized to access this route', 401);
  }
  return req.user;
};
