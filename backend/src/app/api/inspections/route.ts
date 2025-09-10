import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, inspections, cars, users } from '@/db';
import { eq, and, desc } from 'drizzle-orm';

// GET /api/inspections - List user's inspections
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(inspections.userId, session.user.id)];
    
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
        carTitle: cars.title,
        carBrand: cars.brand,
        carModel: cars.model,
        carYear: cars.year,
        carOwnerName: users.name,
        carOwnerEmail: users.email,
      })
      .from(inspections)
      .leftJoin(cars, eq(inspections.carId, cars.id))
      .leftJoin(users, eq(cars.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(inspections.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ inspections: result });
  } catch (error) {
    console.error('Get inspections error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inspections' },
      { status: 500 }
    );
  }
}

// POST /api/inspections - Create inspection request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { carId, date, notes } = await request.json();

    // Validate required fields
    if (!carId || !date) {
      return NextResponse.json(
        { error: 'Car ID and date are required' },
        { status: 400 }
      );
    }

    // Validate date is in the future
    const inspectionDate = new Date(date);
    const now = new Date();
    if (inspectionDate <= now) {
      return NextResponse.json(
        { error: 'Inspection date must be in the future' },
        { status: 400 }
      );
    }

    // Check if car exists and is approved
    const car = await db()
      .select()
      .from(cars)
      .where(eq(cars.id, carId))
      .limit(1);

    if (car.length === 0) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    if (car[0].status !== 'approved') {
      return NextResponse.json(
        { error: 'Car must be approved before inspection can be requested' },
        { status: 400 }
      );
    }

    // Check if user already has a pending inspection for this car
    const existingInspection = await db()
      .select()
      .from(inspections)
      .where(
        and(
          eq(inspections.userId, session.user.id),
          eq(inspections.carId, carId),
          eq(inspections.status, 'pending')
        )
      )
      .limit(1);

    if (existingInspection.length > 0) {
      return NextResponse.json(
        { error: 'You already have a pending inspection for this car' },
        { status: 409 }
      );
    }

    const newInspection = await db()
      .insert(inspections)
      .values({
        userId: session.user.id,
        carId,
        date: inspectionDate,
        notes,
        status: 'pending',
      })
      .returning();

    return NextResponse.json(
      { message: 'Inspection request created successfully', inspection: newInspection[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create inspection error:', error);
    return NextResponse.json(
      { error: 'Failed to create inspection request' },
      { status: 500 }
    );
  }
}