# MotorTech Backend

A Next.js backend application for a car marketplace with inspection services.

## Features

- **Authentication**: NextAuth.js with credentials provider
- **Car Listings**: CRUD operations for car marketplace
- **Inspection System**: Request and manage car inspections
- **Admin Panel**: Admin routes for managing cars and inspections
- **Image Upload**: Cloudinary integration for car photos
- **Database**: PostgreSQL with Drizzle ORM

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- NextAuth.js for authentication
- Drizzle ORM with PostgreSQL
- Cloudinary for image storage
- bcryptjs for password hashing

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env.example` to `.env.local` and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

3. **Database Setup**:
   - Create a PostgreSQL database
   - Update `DATABASE_URL` in your `.env.local`
   - Run migrations:
     ```bash
     npm run db:push
     ```

4. **Cloudinary Setup**:
   - Create a Cloudinary account
   - Add your Cloudinary credentials to `.env.local`

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User login (NextAuth)
- `POST /api/auth/signout` - User logout (NextAuth)

### Cars
- `GET /api/cars` - List cars (with filters)
- `POST /api/cars` - Create car listing
- `GET /api/cars/[id]` - Get single car
- `PATCH /api/cars/[id]` - Update car (owner/admin only)
- `DELETE /api/cars/[id]` - Delete car (owner/admin only)

### Inspections
- `GET /api/inspections` - List user's inspections
- `POST /api/inspections` - Request inspection

### Admin Routes
- `GET /api/admin/cars` - List all cars for admin
- `PATCH /api/admin/cars/[id]` - Approve/reject car
- `DELETE /api/admin/cars/[id]` - Delete car
- `GET /api/admin/inspections` - List all inspections
- `PATCH /api/admin/inspections/[id]` - Update inspection status
- `DELETE /api/admin/inspections/[id]` - Delete inspection

### Upload
- `POST /api/upload` - Upload images to Cloudinary

## Database Schema

### Users
- `id` (Primary Key)
- `name`, `email` (Unique), `phone`
- `password` (Hashed), `role` (user/admin)
- `createdAt`

### Cars
- `id` (Primary Key), `userId` (Foreign Key)
- `title`, `description`, `brand`, `model`, `year`
- `price`, `mileage`, `fuelType`, `transmission`
- `images` (JSON array), `status` (pending/approved)
- `createdAt`, `updatedAt`

### Inspections
- `id` (Primary Key), `userId`, `carId` (Foreign Keys)
- `date`, `notes`, `adminNotes`
- `status` (pending/confirmed), `createdAt`

## Development

### Database Commands
```bash
# Generate migrations
npm run db:generate

# Push schema to database
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

### Build and Deploy
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
