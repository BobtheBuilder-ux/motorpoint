import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { db } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { carsRoutes } from './routes/cars';
import { inspectionsRoutes } from './routes/inspections';
import { adminRoutes } from './routes/admin';
import { uploadRoutes } from './routes/upload';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/inspections', inspectionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize database connection
  try {
    db();
    console.log('✅ Database connection initialized');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
});

export default app;