import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, inspections, cars, users } from '@/db';
import { eq, and, desc } from 'drizzle-orm';

// Middleware to check admin role
async function checkAdminRole() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return { error: 'Unauthorized', status: 401 };
  }
  
  if (session.user.role !== 'admin') {
    return { error: 'Forbidden: Admin access required', status: 403 };
  }
  
  return { session };
}

// GET /api/admin/inspections - List all inspections for admin management
export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminRole();
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    
    if (status) {
      conditions.push(eq(inspections.status, status as 'pending' | 'confirmed'));
    }

    const result = await db()
      .select({
        id: inspections.id,
        userId: inspections.userId,
        carId: inspections.carId,
        date: inspections.date,
        notes: inspections.notes,
        status: inspections.status,
        createdAt: inspections.createdAt,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
        carTitle: cars.title,
        carBrand: cars.brand,
        carModel: cars.model,
        carYear: cars.year,
        carPrice: cars.price,
      })
      .from(inspections)
      .leftJoin(users, eq(inspections.userId, users.id))
      .leftJoin(cars, eq(inspections.carId, cars.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(inspections.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ inspections: result });
  } catch (error) {
    console.error('Admin get inspections error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspections' },
      { status: 500 }
    );
  }
}