"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.optionalAuth = exports.requireAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        throw (0, errorHandler_1.createError)('Access token required', 401);
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw (0, errorHandler_1.createError)('JWT secret not configured', 500);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw (0, errorHandler_1.createError)('Token expired', 401);
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw (0, errorHandler_1.createError)('Invalid token', 401);
        }
        else {
            throw (0, errorHandler_1.createError)('Token verification failed', 401);
        }
    }
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    if (req.user.role !== 'admin') {
        throw (0, errorHandler_1.createError)('Admin access required', 403);
    }
    next();
};
exports.requireAdmin = requireAdmin;
const optionalAuth = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };
    }
    catch (error) {
    }
    next();
};
exports.optionalAuth = optionalAuth;
const generateToken = (user) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw (0, errorHandler_1.createError)('JWT secret not configured', 500);
    }
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };
    return jsonwebtoken_1.default.sign(payload, jwtSecret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};
exports.generateToken = generateToken;
//# sourceMappingURL=auth.js.map