import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, cars, users } from '@/db';
import { eq, and, like, gte, lte, desc } from 'drizzle-orm';

// GET /api/cars - List cars with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get('brand');
    const model = searchParams.get('model');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const status = searchParams.get('status') || 'approved';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [eq(cars.status, status as 'pending' | 'approved')];

    if (brand) {
      conditions.push(like(cars.brand, `%${brand}%`));
    }
    if (model) {
      conditions.push(like(cars.model, `%${model}%`));
    }
    if (minPrice) {
      conditions.push(gte(cars.price, parseInt(minPrice)));
    }
    if (maxPrice) {
      conditions.push(lte(cars.price, parseInt(maxPrice)));
    }

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
      })
      .from(cars)
      .leftJoin(users, eq(cars.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(cars.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({ cars: result });
  } catch (error) {
    console.error('Get cars error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cars' },
      { status: 500 }
    );
  }
}

// POST /api/cars - Create car listing
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, price, brand, model, year, description, images } = await request.json();

    // Validate required fields
    if (!title || !price || !brand || !model || !year) {
      return NextResponse.json(
        { error: 'Title, price, brand, model, and year are required' },
        { status: 400 }
      );
    }

    // Validate price is positive
    if (price <= 0) {
      return NextResponse.json(
        { error: 'Price must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 1) {
      return NextResponse.json(
        { error: 'Invalid year' },
        { status: 400 }
      );
    }

    const newCar = await db()
      .insert(cars)
      .values({
        userId: session.user.id,
        title,
        price: Math.round(price * 100), // Convert to cents
        brand,
        model,
        year,
        description,
        images: images || [],
        status: 'pending',
      })
      .returning();

    return NextResponse.json(
      { message: 'Car listing created successfully', car: newCar[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create car error:', error);
    return NextResponse.json(
      { error: 'Failed to create car listing' },
      { status: 500 }
    );
  }
}