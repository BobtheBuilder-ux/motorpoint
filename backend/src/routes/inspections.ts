import { Router, Request, Response } from 'express';
import { eq, desc, and } from 'drizzle-orm';
import { db, inspections, cars, users, NewInspection } from '../config/database';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Get all inspections (admin) or user's inspections
router.get('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  const { status, limit = '20', offset = '0' } = req.query;

  const conditions = [];

  // Non-admin users can only see their own inspections
  if (req.user.role !== 'admin') {
    conditions.push(eq(inspections.userId, req.user.id));
  }

  if (status) {
    conditions.push(eq(inspections.status, status as 'pending' | 'confirmed'));
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
      year: cars.year
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

  const query = conditions.length > 0 
    ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
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

// Get single inspection by ID
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  const { id } = req.params;

  const [inspection] = await db().select({
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
      price: cars.price,
      description: cars.description,
      images: cars.images
    },
    user: {
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone
    }
  }).from(inspections)
    .leftJoin(cars, eq(inspections.carId, cars.id))
    .leftJoin(users, eq(inspections.userId, users.id))
    .where(eq(inspections.id, id))
    .limit(1);

  if (!inspection) {
    throw createError('Inspection not found', 404);
  }

  // Check permissions
  if (req.user.role !== 'admin' && inspection.user?.id !== req.user.id) {
    throw createError('Permission denied', 403);
  }

  res.status(200).json({
    success: true,
    inspection
  });
}));

// Create new inspection appointment
router.post('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  const { carId, date, notes } = req.body;

  // Validation
  if (!carId || !date) {
    throw createError('Car ID and date are required', 400);
  }

  const inspectionDate = new Date(date);
  if (isNaN(inspectionDate.getTime())) {
    throw createError('Invalid date format', 400);
  }

  if (inspectionDate < new Date()) {
    throw createError('Inspection date cannot be in the past', 400);
  }

  // Check if car exists and is approved
  const [car] = await db().select().from(cars).where(eq(cars.id, carId)).limit(1);
  if (!car) {
    throw createError('Car not found', 404);
  }

  if (car.status !== 'approved') {
    throw createError('Can only book inspections for approved cars', 400);
  }

  const newInspection: NewInspection = {
    userId: req.user.id,
    carId,
    date: inspectionDate,
    notes: notes || null,
    status: 'pending'
  };

  const [createdInspection] = await db().insert(inspections).values(newInspection).returning();

  res.status(201).json({
    success: true,
    message: 'Inspection appointment created successfully',
    inspection: createdInspection
  });
}));

// Update inspection appointment
router.patch('/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  const { id } = req.params;
  const { date, notes } = req.body;

  // Check if inspection exists and user has permission
  const [existingInspection] = await db().select().from(inspections).where(eq(inspections.id, id)).limit(1);
  if (!existingInspection) {
    throw createError('Inspection not found', 404);
  }

  if (existingInspection.userId !== req.user.id && req.user.role !== 'admin') {
    throw createError('Permission denied', 403);
  }

  const updateData: Partial<NewInspection> = {};
  
  if (date) {
    const inspectionDate = new Date(date);
    if (isNaN(inspectionDate.getTime())) {
      throw createError('Invalid date format', 400);
    }
    if (inspectionDate < new Date()) {
      throw createError('Inspection date cannot be in the past', 400);
    }
    updateData.date = inspectionDate;
  }
  
  if (notes !== undefined) {
    updateData.notes = notes;
  }

  if (Object.keys(updateData).length === 0) {
    throw createError('No valid fields to update', 400);
  }

  const [updatedInspection] = await db()
    .update(inspections)
    .set(updateData)
    .where(eq(inspections.id, id))
    .returning();

  res.status(200).json({
    success: true,
    message: 'Inspection updated successfully',
    inspection: updatedInspection
  });
}));

// Delete inspection appointment
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  const { id } = req.params;

  // Check if inspection exists and user has permission
  const [existingInspection] = await db().select().from(inspections).where(eq(inspections.id, id)).limit(1);
  if (!existingInspection) {
    throw createError('Inspection not found', 404);
  }

  if (existingInspection.userId !== req.user.id && req.user.role !== 'admin') {
    throw createError('Permission denied', 403);
  }

  await db().delete(inspections).where(eq(inspections.id, id));

  res.status(200).json({
    success: true,
    message: 'Inspection deleted successfully'
  });
}));

// Admin: Confirm/reject inspection
router.patch('/:id/status', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

export { router as inspectionsRoutes };