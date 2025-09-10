import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/db';

export async function GET() {
  try {
    // Test database connection
    await db().select().from(users).limit(1);
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      service: 'MotorTech Backend',
      version: '1.0.0'
    }, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      service: 'MotorTech Backend',
      version: '1.0.0',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}