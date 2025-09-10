import { pgTable, unique, uuid, varchar, timestamp, foreignKey, integer, text, json, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const carStatus = pgEnum("car_status", ['pending', 'approved'])
export const inspectionStatus = pgEnum("inspection_status", ['pending', 'confirmed'])
export const userRole = pgEnum("user_role", ['user', 'admin'])


export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	phone: varchar({ length: 20 }),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	role: userRole().default('user').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const cars = pgTable("cars", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	price: integer().notNull(),
	brand: varchar({ length: 100 }).notNull(),
	model: varchar({ length: 100 }).notNull(),
	year: integer().notNull(),
	description: text(),
	images: json().default([]),
	status: carStatus().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "cars_user_id_users_id_fk"
		}),
]);

export const inspections = pgTable("inspections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	carId: uuid("car_id").notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	notes: text(),
	status: inspectionStatus().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.carId],
			foreignColumns: [cars.id],
			name: "inspections_car_id_cars_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "inspections_user_id_users_id_fk"
		}),
]);
