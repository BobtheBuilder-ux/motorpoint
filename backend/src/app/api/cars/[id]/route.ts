import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, cars } from '@/db';
import { eq } from 'drizzle-orm';

// GET /api/cars/[id] - Get single car
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const carId = resolvedParams.id;
    
    // Basic UUID format validation
    if (!carId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(carId)) {
      return NextResponse.json(
        { error: 'Invalid car ID' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({ car: car[0] });
  } catch (error) {
    console.error('Get car error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch car' },
      { status: 500 }
    );
  }
}

// PATCH /api/cars/[id] - Update car (only owner or admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const carId = resolvedParams.id;
    
    // Basic UUID format validation
    if (!carId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(carId)) {
      return NextResponse.json(
        { error: 'Invalid car ID' },
        { status: 400 }
      );
    }

    // Check if car exists and get owner info
    const existingCar = await db()
      .select()
      .from(cars)
      .where(eq(cars.id, carId))
      .limit(1);

    if (existingCar.length === 0) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    // Check if user is owner or admin
    const isOwner = existingCar[0].userId === session.user.id;
    const isAdmin = session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own cars' },
        { status: 403 }
      );
    }

    const { title, price, brand, model, year, description, images, status } = await request.json();

    // Build update object with only provided fields
    const updateData: Partial<typeof cars.$inferInsert> = {};
    
    if (title !== undefined) updateData.title = title;
    if (price !== undefined) {
      if (price <= 0) {
        return NextResponse.json(
          { error: 'Price must be greater than 0' },
          { status: 400 }
        );
      }
      updateData.price = Math.round(price * 100); // Convert to cents
    }
    if (brand !== undefined) updateData.brand = brand;
    if (model !== undefined) updateData.model = model;
    if (year !== undefined) {
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear + 1) {
        return NextResponse.json(
          { error: 'Invalid year' },
          { status: 400 }
        );
      }
      updateData.year = year;
    }
    if (description !== undefined) updateData.description = description;
    if (images !== undefined) updateData.images = images;
    
    // Only admin can update status
    if (status !== undefined && isAdmin) {
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updatedCar = await db()
      .update(cars)
      .set(updateData)
      .where(eq(cars.id, carId))
      .returning();

    return NextResponse.json({
      message: 'Car updated successfully',
      car: updatedCar[0],
    });
  } catch (error) {
    console.error('Update car error:', error);
    return NextResponse.json(
      { error: 'Failed to update car' },
      { status: 500 }
    );
  }
}

// DELETE /api/cars/[id] - Delete car (only owner or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const carId = resolvedParams.id;
    
    // Basic UUID format validation
    if (!carId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(carId)) {
      return NextResponse.json(
        { error: 'Invalid car ID' },
        { status: 400 }
      );
    }

    // Check if car exists and get owner info
    const existingCar = await db()
      .select()
      .from(cars)
      .where(eq(cars.id, carId))
      .limit(1);

    if (existingCar.length === 0) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    // Check if user is owner or admin
    const isOwner = existingCar[0].userId === session.user.id;
    const isAdmin = session.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own cars' },
        { status: 403 }
      );
    }

    await db()
      .delete(cars)
      .where(eq(cars.id, carId));

    return NextResponse.json({
      message: 'Car deleted successfully',
    });
  } catch (error) {
    console.error('Delete car error:', error);
    return NextResponse.json(
      { error: 'Failed to delete car' },
      { status: 500 }
    );
  }
}