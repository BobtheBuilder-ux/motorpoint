"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthRoutes = void 0;
const express_1 = require("express");
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
exports.healthRoutes = router;
router.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        await (0, database_1.db)().select().from(database_1.users).limit(1);
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            service: 'MotorTech Express Backend',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        });
    }
    catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            service: 'MotorTech Express Backend',
            version: '1.0.0',
            error: 'Database connection failed'
        });
    }
}));
//# sourceMappingURL=health.js.map