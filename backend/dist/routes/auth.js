"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.authRoutes = router;
router.post('/register', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
        throw (0, errorHandler_1.createError)('Name, email, and password are required', 400);
    }
    if (password.length < 6) {
        throw (0, errorHandler_1.createError)('Password must be at least 6 characters long', 400);
    }
    const existingUser = await (0, database_1.db)().select().from(database_1.users).where((0, drizzle_orm_1.eq)(database_1.users.email, email)).limit(1);
    if (existingUser.length > 0) {
        throw (0, errorHandler_1.createError)('User with this email already exists', 409);
    }
    const saltRounds = 12;
    const passwordHash = await bcryptjs_1.default.hash(password, saltRounds);
    const newUser = {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: 'user'
    };
    const [createdUser] = await (0, database_1.db)().insert(database_1.users).values(newUser).returning({
        id: database_1.users.id,
        name: database_1.users.name,
        email: database_1.users.email,
        phone: database_1.users.phone,
        role: database_1.users.role,
        createdAt: database_1.users.createdAt
    });
    const token = (0, auth_1.generateToken)(createdUser);
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: createdUser,
        token
    });
}));
router.post('/login', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw (0, errorHandler_1.createError)('Email and password are required', 400);
    }
    const [user] = await (0, database_1.db)().select().from(database_1.users).where((0, drizzle_orm_1.eq)(database_1.users.email, email)).limit(1);
    if (!user) {
        throw (0, errorHandler_1.createError)('Invalid email or password', 401);
    }
    const isValidPassword = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isValidPassword) {
        throw (0, errorHandler_1.createError)('Invalid email or password', 401);
    }
    const token = (0, auth_1.generateToken)(user);
    const { passwordHash, ...userWithoutPassword } = user;
    res.status(200).json({
        success: true,
        message: 'Login successful',
        user: userWithoutPassword,
        token
    });
}));
router.get('/me', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('User not found', 404);
    }
    const [user] = await (0, database_1.db)().select({
        id: database_1.users.id,
        name: database_1.users.name,
        email: database_1.users.email,
        phone: database_1.users.phone,
        role: database_1.users.role,
        createdAt: database_1.users.createdAt
    }).from(database_1.users).where((0, drizzle_orm_1.eq)(database_1.users.id, req.user.id)).limit(1);
    if (!user) {
        throw (0, errorHandler_1.createError)('User not found', 404);
    }
    res.status(200).json({
        success: true,
        user
    });
}));
router.patch('/me', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('User not found', 404);
    }
    const { name, phone } = req.body;
    const updateData = {};
    if (name)
        updateData.name = name;
    if (phone !== undefined)
        updateData.phone = phone;
    if (Object.keys(updateData).length === 0) {
        throw (0, errorHandler_1.createError)('No valid fields to update', 400);
    }
    const [updatedUser] = await (0, database_1.db)()
        .update(database_1.users)
        .set(updateData)
        .where((0, drizzle_orm_1.eq)(database_1.users.id, req.user.id))
        .returning({
        id: database_1.users.id,
        name: database_1.users.name,
        email: database_1.users.email,
        phone: database_1.users.phone,
        role: database_1.users.role,
        createdAt: database_1.users.createdAt
    });
    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser
    });
}));
//# sourceMappingURL=auth.js.map