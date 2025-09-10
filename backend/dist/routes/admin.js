"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.adminRoutes = router;
router.get('/stats', auth_1.authenticateToken, auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const [totalUsers] = await (0, database_1.db)().select({ count: (0, drizzle_orm_1.count)() }).from(database_1.users);
    const [totalCars] = await (0, database_1.db)().select({ count: (0, drizzle_orm_1.count)() }).from(database_1.cars);
    const [totalInspections] = await (0, database_1.db)().select({ count: (0, drizzle_orm_1.count)() }).from(database_1.inspections);
    const [pendingCars] = await (0, database_1.db)()
        .select({ count: (0, drizzle_orm_1.count)() })
        .from(database_1.cars)
        .where((0, drizzle_orm_1.eq)(database_1.cars.status, 'pending'));
    const [pendingInspections] = await (0, database_1.db)()
        .select({ count: (0, drizzle_orm_1.count)() })
        .from(database_1.inspections)
        .where((0, drizzle_orm_1.eq)(database_1.inspections.status, 'pending'));
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
router.get('/users', auth_1.authenticateToken, auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { limit = '20', offset = '0', role } = req.query;
    const conditions = [];
    if (role && ['user', 'admin'].includes(role)) {
        conditions.push((0, drizzle_orm_1.eq)(database_1.users.role, role));
    }
    const baseQuery = (0, database_1.db)().select({
        id: database_1.users.id,
        name: database_1.users.name,
        email: database_1.users.email,
        phone: database_1.users.phone,
        role: database_1.users.role,
        createdAt: database_1.users.createdAt
    }).from(database_1.users);
    const query = conditions.length > 0
        ? baseQuery.where(conditions.length === 1 ? conditions[0] : (0, drizzle_orm_1.and)(...conditions))
        : baseQuery;
    const finalQuery = query.orderBy((0, drizzle_orm_1.desc)(database_1.users.createdAt));
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offsetNum = parseInt(offset) || 0;
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
router.patch('/users/:id/role', auth_1.authenticateToken, auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (!role || !['user', 'admin'].includes(role)) {
        throw (0, errorHandler_1.createError)('Valid role (user, admin) is required', 400);
    }
    const [existingUser] = await (0, database_1.db)().select().from(database_1.users).where((0, drizzle_orm_1.eq)(database_1.users.id, id)).limit(1);
    if (!existingUser) {
        throw (0, errorHandler_1.createError)('User not found', 404);
    }
    if (req.user?.id === id) {
        throw (0, errorHandler_1.createError)('Cannot change your own role', 400);
    }
    const [updatedUser] = await (0, database_1.db)()
        .update(database_1.users)
        .set({ role })
        .where((0, drizzle_orm_1.eq)(database_1.users.id, id))
        .returning({
        id: database_1.users.id,
        name: database_1.users.name,
        email: database_1.users.email,
        role: database_1.users.role
    });
    res.status(200).json({
        success: true,
        message: `User role updated to ${role}`,
        user: updatedUser
    });
}));
router.get('/cars', auth_1.authenticateToken, auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { status, limit = '20', offset = '0' } = req.query;
    const carConditions = [];
    if (status && ['pending', 'approved'].includes(status)) {
        carConditions.push((0, drizzle_orm_1.eq)(database_1.cars.status, status));
    }
    const baseQuery = (0, database_1.db)().select({
        id: database_1.cars.id,
        title: database_1.cars.title,
        brand: database_1.cars.brand,
        model: database_1.cars.model,
        year: database_1.cars.year,
        price: database_1.cars.price,
        description: database_1.cars.description,
        images: database_1.cars.images,
        status: database_1.cars.status,
        createdAt: database_1.cars.createdAt,
        user: {
            id: database_1.users.id,
            name: database_1.users.name,
            email: database_1.users.email,
            phone: database_1.users.phone
        }
    }).from(database_1.cars)
        .leftJoin(database_1.users, (0, drizzle_orm_1.eq)(database_1.cars.userId, database_1.users.id));
    const query = carConditions.length > 0
        ? baseQuery.where(carConditions.length === 1 ? carConditions[0] : (0, drizzle_orm_1.and)(...carConditions))
        : baseQuery;
    const finalQuery = query.orderBy((0, drizzle_orm_1.desc)(database_1.cars.createdAt));
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offsetNum = parseInt(offset) || 0;
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
router.patch('/cars/:id/status', auth_1.authenticateToken, auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        throw (0, errorHandler_1.createError)('Valid status (pending, approved, rejected) is required', 400);
    }
    const [existingCar] = await (0, database_1.db)().select().from(database_1.cars).where((0, drizzle_orm_1.eq)(database_1.cars.id, id)).limit(1);
    if (!existingCar) {
        throw (0, errorHandler_1.createError)('Car not found', 404);
    }
    const [updatedCar] = await (0, database_1.db)()
        .update(database_1.cars)
        .set({ status })
        .where((0, drizzle_orm_1.eq)(database_1.cars.id, id))
        .returning();
    res.status(200).json({
        success: true,
        message: `Car listing ${status} successfully`,
        car: updatedCar
    });
}));
router.delete('/cars/:id', auth_1.authenticateToken, auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const [existingCar] = await (0, database_1.db)().select().from(database_1.cars).where((0, drizzle_orm_1.eq)(database_1.cars.id, id)).limit(1);
    if (!existingCar) {
        throw (0, errorHandler_1.createError)('Car not found', 404);
    }
    await (0, database_1.db)().delete(database_1.inspections).where((0, drizzle_orm_1.eq)(database_1.inspections.carId, id));
    await (0, database_1.db)().delete(database_1.cars).where((0, drizzle_orm_1.eq)(database_1.cars.id, id));
    res.status(200).json({
        success: true,
        message: 'Car and related inspections deleted successfully'
    });
}));
router.get('/inspections', auth_1.authenticateToken, auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { status, limit = '20', offset = '0' } = req.query;
    const inspectionConditions = [];
    if (status && ['pending', 'confirmed'].includes(status)) {
        inspectionConditions.push((0, drizzle_orm_1.eq)(database_1.inspections.status, status));
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
            year: database_1.cars.year,
            price: database_1.cars.price
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
    const query = inspectionConditions.length > 0
        ? baseQuery.where(inspectionConditions.length === 1 ? inspectionConditions[0] : (0, drizzle_orm_1.and)(...inspectionConditions))
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
router.patch('/inspections/:id/status', auth_1.authenticateToken, auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
router.delete('/inspections/:id', auth_1.authenticateToken, auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const [existingInspection] = await (0, database_1.db)().select().from(database_1.inspections).where((0, drizzle_orm_1.eq)(database_1.inspections.id, id)).limit(1);
    if (!existingInspection) {
        throw (0, errorHandler_1.createError)('Inspection not found', 404);
    }
    await (0, database_1.db)().delete(database_1.inspections).where((0, drizzle_orm_1.eq)(database_1.inspections.id, id));
    res.status(200).json({
        success: true,
        message: 'Inspection deleted successfully'
    });
}));
//# sourceMappingURL=admin.js.map