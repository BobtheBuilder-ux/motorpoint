"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspectionsRoutes = void 0;
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.inspectionsRoutes = router;
router.get('/', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { status, limit = '20', offset = '0' } = req.query;
    const conditions = [];
    if (req.user.role !== 'admin') {
        conditions.push((0, drizzle_orm_1.eq)(database_1.inspections.userId, req.user.id));
    }
    if (status) {
        conditions.push((0, drizzle_orm_1.eq)(database_1.inspections.status, status));
    }
    const baseQuery = (0, database_1.db)().select({
        id: database_1.inspections.id,
        date: database_1.inspections.date,
        notes: database_1.inspections.notes,
        status: database_1.inspections.status,
        createdAt: database_1.inspections.createdAt,
        car: {
            id: database_1.cars.id,
            title: database_1.cars.title,
            brand: database_1.cars.brand,
            model: database_1.cars.model,
            year: database_1.cars.year
        },
        user: {
            id: database_1.users.id,
            name: database_1.users.name,
            email: database_1.users.email,
            phone: database_1.users.phone
        }
    }).from(database_1.inspections)
        .leftJoin(database_1.cars, (0, drizzle_orm_1.eq)(database_1.inspections.carId, database_1.cars.id))
        .leftJoin(database_1.users, (0, drizzle_orm_1.eq)(database_1.inspections.userId, database_1.users.id));
    const query = conditions.length > 0
        ? baseQuery.where(conditions.length === 1 ? conditions[0] : (0, drizzle_orm_1.and)(...conditions))
        : baseQuery;
    const finalQuery = query.orderBy((0, drizzle_orm_1.desc)(database_1.inspections.date));
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offsetNum = parseInt(offset) || 0;
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
router.get('/:id', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { id } = req.params;
    const [inspection] = await (0, database_1.db)().select({
        id: database_1.inspections.id,
        date: database_1.inspections.date,
        notes: database_1.inspections.notes,
        status: database_1.inspections.status,
        createdAt: database_1.inspections.createdAt,
        car: {
            id: database_1.cars.id,
            title: database_1.cars.title,
            brand: database_1.cars.brand,
            model: database_1.cars.model,
            year: database_1.cars.year,
            price: database_1.cars.price,
            description: database_1.cars.description,
            images: database_1.cars.images
        },
        user: {
            id: database_1.users.id,
            name: database_1.users.name,
            email: database_1.users.email,
            phone: database_1.users.phone
        }
    }).from(database_1.inspections)
        .leftJoin(database_1.cars, (0, drizzle_orm_1.eq)(database_1.inspections.carId, database_1.cars.id))
        .leftJoin(database_1.users, (0, drizzle_orm_1.eq)(database_1.inspections.userId, database_1.users.id))
        .where((0, drizzle_orm_1.eq)(database_1.inspections.id, id))
        .limit(1);
    if (!inspection) {
        throw (0, errorHandler_1.createError)('Inspection not found', 404);
    }
    if (req.user.role !== 'admin' && inspection.user?.id !== req.user.id) {
        throw (0, errorHandler_1.createError)('Permission denied', 403);
    }
    res.status(200).json({
        success: true,
        inspection
    });
}));
router.post('/', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { carId, date, notes } = req.body;
    if (!carId || !date) {
        throw (0, errorHandler_1.createError)('Car ID and date are required', 400);
    }
    const inspectionDate = new Date(date);
    if (isNaN(inspectionDate.getTime())) {
        throw (0, errorHandler_1.createError)('Invalid date format', 400);
    }
    if (inspectionDate < new Date()) {
        throw (0, errorHandler_1.createError)('Inspection date cannot be in the past', 400);
    }
    const [car] = await (0, database_1.db)().select().from(database_1.cars).where((0, drizzle_orm_1.eq)(database_1.cars.id, carId)).limit(1);
    if (!car) {
        throw (0, errorHandler_1.createError)('Car not found', 404);
    }
    if (car.status !== 'approved') {
        throw (0, errorHandler_1.createError)('Can only book inspections for approved cars', 400);
    }
    const newInspection = {
        userId: req.user.id,
        carId,
        date: inspectionDate,
        notes: notes || null,
        status: 'pending'
    };
    const [createdInspection] = await (0, database_1.db)().insert(database_1.inspections).values(newInspection).returning();
    res.status(201).json({
        success: true,
        message: 'Inspection appointment created successfully',
        inspection: createdInspection
    });
}));
router.patch('/:id', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { id } = req.params;
    const { date, notes } = req.body;
    const [existingInspection] = await (0, database_1.db)().select().from(database_1.inspections).where((0, drizzle_orm_1.eq)(database_1.inspections.id, id)).limit(1);
    if (!existingInspection) {
        throw (0, errorHandler_1.createError)('Inspection not found', 404);
    }
    if (existingInspection.userId !== req.user.id && req.user.role !== 'admin') {
        throw (0, errorHandler_1.createError)('Permission denied', 403);
    }
    const updateData = {};
    if (date) {
        const inspectionDate = new Date(date);
        if (isNaN(inspectionDate.getTime())) {
            throw (0, errorHandler_1.createError)('Invalid date format', 400);
        }
        if (inspectionDate < new Date()) {
            throw (0, errorHandler_1.createError)('Inspection date cannot be in the past', 400);
        }
        updateData.date = inspectionDate;
    }
    if (notes !== undefined) {
        updateData.notes = notes;
    }
    if (Object.keys(updateData).length === 0) {
        throw (0, errorHandler_1.createError)('No valid fields to update', 400);
    }
    const [updatedInspection] = await (0, database_1.db)()
        .update(database_1.inspections)
        .set(updateData)
        .where((0, drizzle_orm_1.eq)(database_1.inspections.id, id))
        .returning();
    res.status(200).json({
        success: true,
        message: 'Inspection updated successfully',
        inspection: updatedInspection
    });
}));
router.delete('/:id', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { id } = req.params;
    const [existingInspection] = await (0, database_1.db)().select().from(database_1.inspections).where((0, drizzle_orm_1.eq)(database_1.inspections.id, id)).limit(1);
    if (!existingInspection) {
        throw (0, errorHandler_1.createError)('Inspection not found', 404);
    }
    if (existingInspection.userId !== req.user.id && req.user.role !== 'admin') {
        throw (0, errorHandler_1.createError)('Permission denied', 403);
    }
    await (0, database_1.db)().delete(database_1.inspections).where((0, drizzle_orm_1.eq)(database_1.inspections.id, id));
    res.status(200).json({
        success: true,
        message: 'Inspection deleted successfully'
    });
}));
router.patch('/:id/status', auth_1.authenticateToken, auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['pending', 'confirmed'].includes(status)) {
        throw (0, errorHandler_1.createError)('Valid status (pending, confirmed) is required', 400);
    }
    const [existingInspection] = await (0, database_1.db)().select().from(database_1.inspections).where((0, drizzle_orm_1.eq)(database_1.inspections.id, id)).limit(1);
    if (!existingInspection) {
        throw (0, errorHandler_1.createError)('Inspection not found', 404);
    }
    const [updatedInspection] = await (0, database_1.db)()
        .update(database_1.inspections)
        .set({ status })
        .where((0, drizzle_orm_1.eq)(database_1.inspections.id, id))
        .returning();
    res.status(200).json({
        success: true,
        message: `Inspection ${status} successfully`,
        inspection: updatedInspection
    });
}));
//# sourceMappingURL=inspections.js.map