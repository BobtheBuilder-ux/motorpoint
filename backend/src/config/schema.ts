import { pgTable, serial, varchar, text, integer, timestamp, pgEnum, json, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const carStatusEnum = pgEnum('car_status', ['pending', 'approved']);
export const inspectionStatusEnum = pgEnum('inspection_status', ['pending', 'confirmed']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Cars table
export const cars = pgTable('cars', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  price: integer('price').notNull(), // Price in cents
  brand: varchar('brand', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  year: integer('year').notNull(),
  description: text('description'),
  images: json('images').$type<string[]>().default([]), // Array of Cloudinary URLs
  status: carStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Inspections table
export const inspections = pgTable('inspections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  carId: uuid('car_id').references(() => cars.id).notNull(),
  date: timestamp('date').notNull(),
  notes: text('notes'),
  status: inspectionStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  cars: many(cars),
  inspections: many(inspections),
}));

export const carsRelations = relations(cars, ({ one, many }) => ({
  user: one(users, {
    fields: [cars.userId],
    references: [users.id],
  }),
  inspections: many(inspections),
}));

export const inspectionsRelations = relations(inspections, ({ one }) => ({
  user: one(users, {
    fields: [inspections.userId],
    references: [users.id],
  }),
  car: one(cars, {
    fields: [inspections.carId],
    references: [cars.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Car = typeof cars.$inferSelect;
export type NewCar = typeof cars.$inferInsert;
export type Inspection = typeof inspections.$inferSelect;
export type NewInspection = typeof inspections.$inferInsert;