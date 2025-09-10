import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, inspections } from '@/db';
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

// PATCH /api/admin/inspections/[id] - Update inspection status
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
    const inspectionId = resolvedParams.id;
    
    // Basic UUID format validation
    if (!inspectionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inspectionId)) {
      return NextResponse.json(
        { error: 'Invalid inspection ID' },
        { status: 400 }
      );
    }

    const { status, adminNotes, date } = await request.json();

    // Validate status
    if (!status || !['pending', 'confirmed'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "pending" or "confirmed"' },
        { status: 400 }
      );
    }

    // Check if inspection exists
    const existingInspection = await db()
      .select()
      .from(inspections)
      .where(eq(inspections.id, inspectionId))
      .limit(1);

    if (existingInspection.length === 0) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: { status: 'pending' | 'confirmed'; adminNotes?: string; date?: Date } = { status: status as 'pending' | 'confirmed' };
    
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    
    if (date) {
      const inspectionDate = new Date(date);
      updateData.date = inspectionDate;
    }

    const updatedInspection = await db()
      .update(inspections)
      .set(updateData)
      .where(eq(inspections.id, inspectionId))
      .returning();

    const action = status === 'confirmed' ? 'confirmed' : 'set to pending';
    
    return NextResponse.json({
      message: `Inspection ${action} successfully`,
      inspection: updatedInspection[0],
    });
  } catch (error) {
    console.error('Admin update inspection error:', error);
    return NextResponse.json(
      { error: 'Failed to update inspection status' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/inspections/[id] - Delete inspection (admin only)
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
    const inspectionId = resolvedParams.id;
    
    // Basic UUID format validation
    if (!inspectionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inspectionId)) {
      return NextResponse.json(
        { error: 'Invalid inspection ID' },
        { status: 400 }
      );
    }

    // Check if inspection exists
    const existingInspection = await db()
      .select()
      .from(inspections)
      .where(eq(inspections.id, inspectionId))
      .limit(1);

    if (existingInspection.length === 0) {
      return NextResponse.json(
        { error: 'Inspection not found' },
        { status: 404 }
      );
    }

    await db()
      .delete(inspections)
      .where(eq(inspections.id, inspectionId));

    return NextResponse.json({
      message: 'Inspection deleted successfully',
    });
  } catch (error) {
    console.error('Admin delete inspection error:', error);
    return NextResponse.json(
      { error: 'Failed to delete inspection' },
      { status: 500 }
    );
  }
}