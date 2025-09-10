import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler';
import { User } from '../config/schema';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    throw createError('Access token required', 401);
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw createError('JWT secret not configured', 500);
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role as 'user' | 'admin',
    } as User;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createError('Token expired', 401);
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw createError('Invalid token', 401);
    } else {
      throw createError('Token verification failed', 401);
    }
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  if (req.user.role !== 'admin') {
    throw createError('Admin access required', 403);
  }

  next();
};

export const optionalAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role as 'user' | 'admin',
    } as User;
  } catch (error) {
    // Ignore token errors for optional auth
  }

  next();
};

export const generateToken = (user: User): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw createError('JWT secret not configured', 500);
  }

  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};