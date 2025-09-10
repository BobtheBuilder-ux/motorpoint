import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, cars, users } from '@/db';
import { eq, desc } from 'drizzle-orm';

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

// GET /api/admin/cars - List all cars for admin review
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
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const result = await db()
      .select({
        id: cars.id,
        userId: cars.userId,
        title: cars.title,
        price: cars.price,
        brand: cars.brand,
        model: cars.model,
        year: cars.year,
        description: cars.description,
        images: cars.images,
        status: cars.status,
        createdAt: cars.createdAt,
        userName: users.name,
        userEmail: users.email,
        userPhone: users.phone,
      })
      .from(cars)
      .leftJoin(users, eq(cars.userId, users.id))
      .where(eq(cars.status, status as 'pending' | 'approved'))
      .orderBy(desc(cars.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ cars: result });
  } catch (error) {
    console.error('Admin get cars error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cars' },
      { status: 500 }
    );
  }
}