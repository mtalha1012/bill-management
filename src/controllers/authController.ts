import jwt, { SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import User, { UserDocument } from '../models/User.js';
import { AppError, asyncHandler } from '../middleware/error.js';
import { getAuthUser } from '../middleware/auth.js';
import { getEnv } from '../config/env.js';
import {
  AuthResponse,
  LoginBody,
  MeResponse,
  PublicUser,
  RegisterBody
} from '../types/api.js';

const generateToken = (id: Types.ObjectId): string => {
  return jwt.sign({ id: id.toString() }, getEnv('JWT_SECRET'), {
    expiresIn: getEnv('JWT_EXPIRES_IN') as SignOptions['expiresIn']
  });
};

const toPublicUser = (user: UserDocument): PublicUser => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt
});

export const register = asyncHandler<{}, AuthResponse, RegisterBody>(
  async (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(new AppError('Please provide name, email, and password', 400));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email is already registered', 409));
    }

    const user = await User.create({
      name,
      email,
      password
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: toPublicUser(user)
    });
  }
);

export const login = asyncHandler<{}, AuthResponse, LoginBody>(
  async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: toPublicUser(user)
    });
  }
);

export const getMe = asyncHandler<{}, MeResponse>(async (req, res) => {
  res.status(200).json({
    success: true,
    user: toPublicUser(getAuthUser(req))
  });
});
