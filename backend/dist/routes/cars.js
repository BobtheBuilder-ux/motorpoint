"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.carsRoutes = void 0;
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.carsRoutes = router;
router.get('/', auth_1.optionalAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { status, brand, model, minPrice, maxPrice, limit = '20', offset = '0' } = req.query;
    const conditions = [];
    if (!req.user || req.user.role !== 'admin') {
        conditions.push((0, drizzle_orm_1.eq)(database_1.cars.status, 'approved'));
    }
    else if (status) {
        conditions.push((0, drizzle_orm_1.eq)(database_1.cars.status, status));
    }
    if (brand)
        conditions.push((0, drizzle_orm_1.eq)(database_1.cars.brand, brand));
    if (model)
        conditions.push((0, drizzle_orm_1.eq)(database_1.cars.model, model));
    const baseQuery = (0, database_1.db)().select({
        id: database_1.cars.id,
        title: database_1.cars.title,
        price: database_1.cars.price,
        brand: database_1.cars.brand,
        model: database_1.cars.model,
        year: database_1.cars.year,
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
    const query = conditions.length > 0
        ? baseQuery.where(conditions.length === 1 ? conditions[0] : (0, drizzle_orm_1.and)(...conditions))
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
router.get('/:id', auth_1.optionalAuth, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const [car] = await (0, database_1.db)().select({
        id: database_1.cars.id,
        title: database_1.cars.title,
        price: database_1.cars.price,
        brand: database_1.cars.brand,
        model: database_1.cars.model,
        year: database_1.cars.year,
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
        .leftJoin(database_1.users, (0, drizzle_orm_1.eq)(database_1.cars.userId, database_1.users.id))
        .where((0, drizzle_orm_1.eq)(database_1.cars.id, id))
        .limit(1);
    if (!car) {
        throw (0, errorHandler_1.createError)('Car not found', 404);
    }
    if (car.status === 'pending' &&
        (!req.user || (req.user.role !== 'admin' && req.user.id !== car.user?.id))) {
        throw (0, errorHandler_1.createError)('Car not found', 404);
    }
    res.status(200).json({
        success: true,
        car
    });
}));
router.post('/', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { title, price, brand, model, year, description, images } = req.body;
    if (!title || !price || !brand || !model || !year) {
        throw (0, errorHandler_1.createError)('Title, price, brand, model, and year are required', 400);
    }
    if (price <= 0) {
        throw (0, errorHandler_1.createError)('Price must be greater than 0', 400);
    }
    if (year < 1900 || year > new Date().getFullYear() + 1) {
        throw (0, errorHandler_1.createError)('Invalid year', 400);
    }
    const newCar = {
        userId: req.user.id,
        title,
        price: Math.round(price * 100),
        brand,
        model,
        year,
        description: description || null,
        images: images || [],
        status: 'pending'
    };
    const [createdCar] = await (0, database_1.db)().insert(database_1.cars).values(newCar).returning();
    res.status(201).json({
        success: true,
        message: 'Car listing created successfully',
        car: createdCar
    });
}));
router.patch('/:id', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { id } = req.params;
    const { title, price, brand, model, year, description, images } = req.body;
    const [existingCar] = await (0, database_1.db)().select().from(database_1.cars).where((0, drizzle_orm_1.eq)(database_1.cars.id, id)).limit(1);
    if (!existingCar) {
        throw (0, errorHandler_1.createError)('Car not found', 404);
    }
    if (existingCar.userId !== req.user.id && req.user.role !== 'admin') {
        throw (0, errorHandler_1.createError)('Permission denied', 403);
    }
    const updateData = {};
    if (title)
        updateData.title = title;
    if (price)
        updateData.price = Math.round(price * 100);
    if (brand)
        updateData.brand = brand;
    if (model)
        updateData.model = model;
    if (year)
        updateData.year = year;
    if (description !== undefined)
        updateData.description = description;
    if (images)
        updateData.images = images;
    if (Object.keys(updateData).length === 0) {
        throw (0, errorHandler_1.createError)('No valid fields to update', 400);
    }
    const [updatedCar] = await (0, database_1.db)()
        .update(database_1.cars)
        .set(updateData)
        .where((0, drizzle_orm_1.eq)(database_1.cars.id, id))
        .returning();
    res.status(200).json({
        success: true,
        message: 'Car updated successfully',
        car: updatedCar
    });
}));
router.delete('/:id', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { id } = req.params;
    const [existingCar] = await (0, database_1.db)().select().from(database_1.cars).where((0, drizzle_orm_1.eq)(database_1.cars.id, id)).limit(1);
    if (!existingCar) {
        throw (0, errorHandler_1.createError)('Car not found', 404);
    }
    if (existingCar.userId !== req.user.id && req.user.role !== 'admin') {
        throw (0, errorHandler_1.createError)('Permission denied', 403);
    }
    await (0, database_1.db)().delete(database_1.cars).where((0, drizzle_orm_1.eq)(database_1.cars.id, id));
    res.status(200).json({
        success: true,
        message: 'Car deleted successfully'
    });
}));
router.patch('/:id/status', auth_1.authenticateToken, auth_1.requireAdmin, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['pending', 'approved'].includes(status)) {
        throw (0, errorHandler_1.createError)('Valid status (pending, approved) is required', 400);
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
        message: `Car ${status} successfully`,
        car: updatedCar
    });
}));
//# sourceMappingURL=cars.js.map