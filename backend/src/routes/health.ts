import { Router, Request, Response } from 'express';
import { db, users } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Test database connection
    await db().select().from(users).limit(1);
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      service: 'MotorTech Express Backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
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

export { router as healthRoutes };