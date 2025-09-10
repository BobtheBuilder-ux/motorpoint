"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
const health_1 = require("./routes/health");
const auth_1 = require("./routes/auth");
const cars_1 = require("./routes/cars");
const inspections_1 = require("./routes/inspections");
const admin_1 = require("./routes/admin");
const upload_1 = require("./routes/upload");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/health', health_1.healthRoutes);
app.use('/api/auth', auth_1.authRoutes);
app.use('/api/cars', cars_1.carsRoutes);
app.use('/api/inspections', inspections_1.inspectionsRoutes);
app.use('/api/admin', admin_1.adminRoutes);
app.use('/api/upload', upload_1.uploadRoutes);
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    try {
        (0, database_1.db)();
        console.log('✅ Database connection initialized');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
    }
});
exports.default = app;
//# sourceMappingURL=index.js.map