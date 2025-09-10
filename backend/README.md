# MotorTech Express Backend

A robust Node.js and Express backend for the MotorTech car marketplace application. This backend provides RESTful APIs for user authentication, car listings management, inspection appointments, and administrative functions.

## Features

- **RESTful API Architecture**: Clean and organized API endpoints following REST principles
- **JWT Authentication**: Secure user authentication and authorization
- **Role-based Access Control**: User and admin roles with appropriate permissions
- **Database Integration**: PostgreSQL with Drizzle ORM for type-safe database operations
- **File Upload**: Cloudinary integration for image upload and management
- **Error Handling**: Centralized error handling with custom error types
- **Security Middleware**: CORS, Helmet, and rate limiting for enhanced security
- **TypeScript**: Full TypeScript support for type safety
- **Validation**: Request validation and sanitization

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **Security**: Helmet, CORS, bcryptjs
- **Development**: Nodemon, ts-node

## Project Structure

```
src/
├── config/
│   ├── database.ts      # Database configuration and connection
│   └── schema.ts        # Database schema definitions
├── middleware/
│   ├── auth.ts          # Authentication middleware
│   └── errorHandler.ts  # Error handling middleware
├── routes/
│   ├── admin.ts         # Admin management routes
│   ├── auth.ts          # Authentication routes
│   ├── cars.ts          # Car listings routes
│   ├── health.ts        # Health check routes
│   ├── inspections.ts   # Inspection appointments routes
│   └── upload.ts        # File upload routes
├── types/
├── utils/
└── index.ts             # Main application entry point
```

## Installation

1. **Clone the repository**:
   ```bash
   cd express-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/motortech
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   PORT=3001
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   ```

4. **Database Setup**:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PATCH /api/auth/profile` - Update user profile

### Cars
- `GET /api/cars` - Get all approved cars (with filtering)
- `GET /api/cars/:id` - Get single car details
- `POST /api/cars` - Create new car listing (authenticated)
- `PATCH /api/cars/:id` - Update car listing (owner only)
- `DELETE /api/cars/:id` - Delete car listing (owner only)

### Inspections
- `GET /api/inspections` - Get user's inspections
- `GET /api/inspections/:id` - Get single inspection
- `POST /api/inspections` - Book inspection appointment
- `PATCH /api/inspections/:id` - Update inspection
- `DELETE /api/inspections/:id` - Cancel inspection

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - Get all users
- `PATCH /api/admin/users/:id/role` - Update user role
- `GET /api/admin/cars` - Get all cars (including pending)
- `PATCH /api/admin/cars/:id/status` - Approve/reject car listings
- `DELETE /api/admin/cars/:id` - Delete car listing
- `GET /api/admin/inspections` - Get all inspections
- `PATCH /api/admin/inspections/:id/status` - Confirm/reject inspections
- `DELETE /api/admin/inspections/:id` - Delete inspection

### File Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images
- `DELETE /api/upload/image/:publicId` - Delete image
- `POST /api/upload/transform` - Get transformed image URL

### Health Check
- `GET /api/health` - Health check with database status

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

## Security Features

- **CORS**: Configured for cross-origin requests
- **Helmet**: Security headers for protection
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Input Validation**: Request validation and sanitization
- **Password Hashing**: bcrypt for secure password storage
- **JWT Tokens**: Secure authentication tokens

## Development

### Adding New Routes

1. Create route file in `src/routes/`
2. Import and register in `src/index.ts`
3. Add authentication middleware if needed
4. Implement error handling with `asyncHandler`

### Database Changes

1. Update schema in `src/config/schema.ts`
2. Generate migration: `npm run db:generate`
3. Apply migration: `npm run db:migrate`

## Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Start the production server**:
   ```bash
   npm start
   ```

## Contributing

1. Follow TypeScript best practices
2. Use proper error handling with `asyncHandler`
3. Add authentication middleware to protected routes
4. Validate input data
5. Write descriptive commit messages

## License

MIT License