import { Router, Request, Response } from 'express';
import { eq, desc, and } from 'drizzle-orm';
import { db, cars, users, NewCar } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, requireAdmin, optionalAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get all cars (public endpoint with optional auth)
router.get('/', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status, brand, model, minPrice, maxPrice, limit = '20', offset = '0' } = req.query;

  // Apply filters
  const conditions = [];
  
  // Only show approved cars to non-admin users
  if (!req.user || req.user.role !== 'admin') {
    conditions.push(eq(cars.status, 'approved'));
  } else if (status) {
    conditions.push(eq(cars.status, status as 'pending' | 'approved'));
  }

  if (brand) conditions.push(eq(cars.brand, brand as string));
  if (model) conditions.push(eq(cars.model, model as string));
  // Note: Price filtering would need additional logic for range queries

  const baseQuery = db().select({
    id: cars.id,
    title: cars.title,
    price: cars.price,
    brand: cars.brand,
    model: cars.model,
    year: cars.year,
    description: cars.description,
    images: cars.images,
    status: cars.status,
    createdAt: cars.createdAt,
    user: {
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone
    }
  }).from(cars)
    .leftJoin(users, eq(cars.userId, users.id));

  const query = conditions.length > 0 
    ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
    : baseQuery;

  const finalQuery = query.orderBy(desc(cars.createdAt))

  const limitNum = Math.min(parseInt(limit as string) || 20, 100);
  const offsetNum = parseInt(offset as string) || 0;

  const result = await finalQuery.limit(limitNum).offset(offsetNum);

  res.status(200).json({
    success: true,
    cars: result,
    pagination: {
      limit: limitNum,
      offset: offsetNum,
      total: result.length
    }
  });
}));

// Get single car by ID
router.get('/:id', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const [car] = await db().select({
    id: cars.id,
    title: cars.title,
    price: cars.price,
    brand: cars.brand,
    model: cars.model,
    year: cars.year,
    description: cars.description,
    images: cars.images,
    status: cars.status,
    createdAt: cars.createdAt,
    user: {
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone
    }
  }).from(cars)
    .leftJoin(users, eq(cars.userId, users.id))
    .where(eq(cars.id, id))
    .limit(1);

  if (!car) {
    throw createError('Car not found', 404);
  }

  // Only show pending cars to admin or owner
  if (car.status === 'pending' && 
      (!req.user || (req.user.role !== 'admin' && req.user.id !== car.user?.id))) {
    throw createError('Car not found', 404);
  }

  res.status(200).json({
    success: true,
    car
  });
}));

// Create new car listing
router.post('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  const { title, price, brand, model, year, description, images } = req.body;

  // Validation
  if (!title || !price || !brand || !model || !year) {
    throw createError('Title, price, brand, model, and year are required', 400);
  }

  if (price <= 0) {
    throw createError('Price must be greater than 0', 400);
  }

  if (year < 1900 || year > new Date().getFullYear() + 1) {
    throw createError('Invalid year', 400);
  }

  const newCar: NewCar = {
    userId: req.user.id,
    title,
    price: Math.round(price * 100), // Convert to cents
    brand,
    model,
    year,
    description: description || null,
    images: images || [],
    status: 'pending'
  };

  const [createdCar] = await db().insert(cars).values(newCar).returning();

  res.status(201).json({
    success: true,
    message: 'Car listing created successfully',
    car: createdCar
  });
}));

// Update car listing
router.patch('/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  const { id } = req.params;
  const { title, price, brand, model, year, description, images } = req.body;

  // Check if car exists and user has permission
  const [existingCar] = await db().select().from(cars).where(eq(cars.id, id)).limit(1);
  if (!existingCar) {
    throw createError('Car not found', 404);
  }

  if (existingCar.userId !== req.user.id && req.user.role !== 'admin') {
    throw createError('Permission denied', 403);
  }

  const updateData: Partial<NewCar> = {};
  if (title) updateData.title = title;
  if (price) updateData.price = Math.round(price * 100);
  if (brand) updateData.brand = brand;
  if (model) updateData.model = model;
  if (year) updateData.year = year;
  if (description !== undefined) updateData.description = description;
  if (images) updateData.images = images;

  if (Object.keys(updateData).length === 0) {
    throw createError('No valid fields to update', 400);
  }

  const [updatedCar] = await db()
    .update(cars)
    .set(updateData)
    .where(eq(cars.id, id))
    .returning();

  res.status(200).json({
    success: true,
    message: 'Car updated successfully',
    car: updatedCar
  });
}));

// Delete car listing
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  const { id } = req.params;

  // Check if car exists and user has permission
  const [existingCar] = await db().select().from(cars).where(eq(cars.id, id)).limit(1);
  if (!existingCar) {
    throw createError('Car not found', 404);
  }

  if (existingCar.userId !== req.user.id && req.user.role !== 'admin') {
    throw createError('Permission denied', 403);
  }

  await db().delete(cars).where(eq(cars.id, id));

  res.status(200).json({
    success: true,
    message: 'Car deleted successfully'
  });
}));

// Admin: Approve/reject car listing
router.patch('/:id/status', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'approved'].includes(status)) {
    throw createError('Valid status (pending, approved) is required', 400);
  }

  const [existingCar] = await db().select().from(cars).where(eq(cars.id, id)).limit(1);
  if (!existingCar) {
    throw createError('Car not found', 404);
  }

  const [updatedCar] = await db()
    .update(cars)
    .set({ status })
    .where(eq(cars.id, id))
    .returning();

  res.status(200).json({
    success: true,
    message: `Car ${status} successfully`,
    car: updatedCar
  });
}));

export { router as carsRoutes };