import { Router, Request, Response } from 'express';
import { eq, desc, and, count, sql } from 'drizzle-orm';
import { db, cars, inspections, users } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Admin dashboard stats
router.get('/stats', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const [totalUsers] = await db().select({ count: count() }).from(users);
  const [totalCars] = await db().select({ count: count() }).from(cars);
  const [totalInspections] = await db().select({ count: count() }).from(inspections);
  
  const [pendingCars] = await db()
    .select({ count: count() })
    .from(cars)
    .where(eq(cars.status, 'pending'));
    
  const [pendingInspections] = await db()
    .select({ count: count() })
    .from(inspections)
    .where(eq(inspections.status, 'pending'));

  res.status(200).json({
    success: true,
    stats: {
      totalUsers: totalUsers.count,
      totalCars: totalCars.count,
      totalInspections: totalInspections.count,
      pendingCars: pendingCars.count,
      pendingInspections: pendingInspections.count
    }
  });
}));

// Get all users with pagination
router.get('/users', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { limit = '20', offset = '0', role } = req.query;

  const conditions = [];
  if (role && ['user', 'admin'].includes(role as string)) {
    conditions.push(eq(users.role, role as 'user' | 'admin'));
  }

  const baseQuery = db().select({
    id: users.id,
    name: users.name,
    email: users.email,
    phone: users.phone,
    role: users.role,
    createdAt: users.createdAt
  }).from(users);

  const query = conditions.length > 0 
    ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
    : baseQuery;

  const finalQuery = query.orderBy(desc(users.createdAt));

  const limitNum = Math.min(parseInt(limit as string) || 20, 100);
  const offsetNum = parseInt(offset as string) || 0;

  const result = await finalQuery.limit(limitNum).offset(offsetNum);

  res.status(200).json({
    success: true,
    users: result,
    pagination: {
      limit: limitNum,
      offset: offsetNum,
      total: result.length
    }
  });
}));

// Update user role
router.patch('/users/:id/role', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !['user', 'admin'].includes(role)) {
    throw createError('Valid role (user, admin) is required', 400);
  }

  const [existingUser] = await db().select().from(users).where(eq(users.id, id)).limit(1);
  if (!existingUser) {
    throw createError('User not found', 404);
  }

  // Prevent admin from changing their own role
  if (req.user?.id === id) {
    throw createError('Cannot change your own role', 400);
  }

  const [updatedUser] = await db()
    .update(users)
    .set({ role })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role
    });

  res.status(200).json({
    success: true,
    message: `User role updated to ${role}`,
    user: updatedUser
  });
}));

// Get all cars with detailed info for admin
router.get('/cars', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status, limit = '20', offset = '0' } = req.query;

  const carConditions = [];
  if (status && ['pending', 'approved'].includes(status as string)) {
    carConditions.push(eq(cars.status, status as 'pending' | 'approved'));
  }

  const baseQuery = db().select({
    id: cars.id,
    title: cars.title,
    brand: cars.brand,
    model: cars.model,
    year: cars.year,
    price: cars.price,
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

  const query = carConditions.length > 0 
    ? baseQuery.where(carConditions.length === 1 ? carConditions[0] : and(...carConditions))
    : baseQuery;

  const finalQuery = query.orderBy(desc(cars.createdAt));

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

// Approve/reject car listing
router.patch('/cars/:id/status', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    throw createError('Valid status (pending, approved, rejected) is required', 400);
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
    message: `Car listing ${status} successfully`,
    car: updatedCar
  });
}));

// Delete car listing (admin only)
router.delete('/cars/:id', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const [existingCar] = await db().select().from(cars).where(eq(cars.id, id)).limit(1);
  if (!existingCar) {
    throw createError('Car not found', 404);
  }

  // Delete related inspections first
  await db().delete(inspections).where(eq(inspections.carId, id));
  
  // Delete the car
  await db().delete(cars).where(eq(cars.id, id));

  res.status(200).json({
    success: true,
    message: 'Car and related inspections deleted successfully'
  });
}));

// Get all inspections with detailed info for admin
router.get('/inspections', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status, limit = '20', offset = '0' } = req.query;

  const inspectionConditions = [];
  if (status && ['pending', 'confirmed'].includes(status as string)) {
    inspectionConditions.push(eq(inspections.status, status as 'pending' | 'confirmed'));
  }

  const baseQuery = db().select({
    id: inspections.id,
    date: inspections.date,
    notes: inspections.notes,
    status: inspections.status,
    createdAt: inspections.createdAt,
    car: {
      id: cars.id,
      title: cars.title,
      brand: cars.brand,
      model: cars.model,
      year: cars.year,
      price: cars.price
    },
    user: {
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone
    }
  }).from(inspections)
    .leftJoin(cars, eq(inspections.carId, cars.id))
    .leftJoin(users, eq(inspections.userId, users.id));

  const query = inspectionConditions.length > 0 
    ? baseQuery.where(inspectionConditions.length === 1 ? inspectionConditions[0] : and(...inspectionConditions))
    : baseQuery;

  const finalQuery = query.orderBy(desc(inspections.date));

  const limitNum = Math.min(parseInt(limit as string) || 20, 100);
  const offsetNum = parseInt(offset as string) || 0;

  const result = await finalQuery.limit(limitNum).offset(offsetNum);

  res.status(200).json({
    success: true,
    inspections: result,
    pagination: {
      limit: limitNum,
      offset: offsetNum,
      total: result.length
    }
  });
}));

// Confirm/reject inspection (admin)
router.patch('/inspections/:id/status', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['pending', 'confirmed'].includes(status)) {
    throw createError('Valid status (pending, confirmed) is required', 400);
  }

  const [existingInspection] = await db().select().from(inspections).where(eq(inspections.id, id)).limit(1);
  if (!existingInspection) {
    throw createError('Inspection not found', 404);
  }

  const [updatedInspection] = await db()
    .update(inspections)
    .set({ status })
    .where(eq(inspections.id, id))
    .returning();

  res.status(200).json({
    success: true,
    message: `Inspection ${status} successfully`,
    inspection: updatedInspection
  });
}));

// Delete inspection (admin only)
router.delete('/inspections/:id', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const [existingInspection] = await db().select().from(inspections).where(eq(inspections.id, id)).limit(1);
  if (!existingInspection) {
    throw createError('Inspection not found', 404);
  }

  await db().delete(inspections).where(eq(inspections.id, id));

  res.status(200).json({
    success: true,
    message: 'Inspection deleted successfully'
  });
}));

export { router as adminRoutes };