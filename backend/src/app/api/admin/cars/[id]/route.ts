import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, cars } from '@/db';
import { eq } from 'drizzle-orm';

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

// PATCH /api/admin/cars/[id] - Approve or reject car listing
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkAdminRole();
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
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

    const { status, adminNotes } = await request.json();

    // Validate status
    if (!status || !['approved', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "approved" or "pending"' },
        { status: 400 }
      );
    }

    // Check if car exists
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

    // Update car status
    const updateData: { status: 'approved' | 'pending'; adminNotes?: string } = { status: status as 'approved' | 'pending' };
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    const updatedCar = await db()
      .update(cars)
      .set(updateData)
      .where(eq(cars.id, carId))
      .returning();

    const action = status === 'approved' ? 'approved' : 'set to pending';
    
    return NextResponse.json({
      message: `Car listing ${action} successfully`,
      car: updatedCar[0],
    });
  } catch (error) {
    console.error('Admin update car error:', error);
    return NextResponse.json(
      { error: 'Failed to update car status' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/cars/[id] - Delete car listing (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await checkAdminRole();
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
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

    // Check if car exists
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

    await db()
      .delete(cars)
      .where(eq(cars.id, carId));

    return NextResponse.json({
      message: 'Car listing deleted successfully',
    });
  } catch (error) {
    console.error('Admin delete car error:', error);
    return NextResponse.json(
      { error: 'Failed to delete car' },
      { status: 500 }
    );
  }
}