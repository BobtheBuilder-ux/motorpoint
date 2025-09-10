import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, users, NewUser } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, generateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Register new user
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    throw createError('Name, email, and password are required', 400);
  }

  if (password.length < 6) {
    throw createError('Password must be at least 6 characters long', 400);
  }

  // Check if user already exists
  const existingUser = await db().select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser.length > 0) {
    throw createError('User with this email already exists', 409);
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const newUser: NewUser = {
    name,
    email,
    phone: phone || null,
    passwordHash,
    role: 'user'
  };

  const [createdUser] = await db().insert(users).values(newUser).returning({
    id: users.id,
    name: users.name,
    email: users.email,
    phone: users.phone,
    role: users.role,
    createdAt: users.createdAt
  });

  // Generate JWT token
  const token = generateToken(createdUser as any);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: createdUser,
    token
  });
}));

// Login user
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw createError('Email and password are required', 400);
  }

  // Find user
  const [user] = await db().select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw createError('Invalid email or password', 401);
  }

  // Generate JWT token
  const token = generateToken(user);

  // Return user without password hash
  const { passwordHash, ...userWithoutPassword } = user;

  res.status(200).json({
    success: true,
    message: 'Login successful',
    user: userWithoutPassword,
    token
  });
}));

// Get current user profile
router.get('/me', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw createError('User not found', 404);
  }

  // Fetch fresh user data
  const [user] = await db().select({
    id: users.id,
    name: users.name,
    email: users.email,
    phone: users.phone,
    role: users.role,
    createdAt: users.createdAt
  }).from(users).where(eq(users.id, req.user.id)).limit(1);

  if (!user) {
    throw createError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    user
  });
}));

// Update user profile
router.patch('/me', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw createError('User not found', 404);
  }

  const { name, phone } = req.body;
  const updateData: Partial<NewUser> = {};

  if (name) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;

  if (Object.keys(updateData).length === 0) {
    throw createError('No valid fields to update', 400);
  }

  const [updatedUser] = await db()
    .update(users)
    .set(updateData)
    .where(eq(users.id, req.user.id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      createdAt: users.createdAt
    });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user: updatedUser
  });
}));

export { router as authRoutes };