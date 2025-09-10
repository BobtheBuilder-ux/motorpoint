import { relations } from "drizzle-orm/relations";
import { users, cars, inspections } from "./schema";

export const carsRelations = relations(cars, ({one, many}) => ({
	user: one(users, {
		fields: [cars.userId],
		references: [users.id]
	}),
	inspections: many(inspections),
}));

export const usersRelations = relations(users, ({many}) => ({
	cars: many(cars),
	inspections: many(inspections),
}));

export const inspectionsRelations = relations(inspections, ({one}) => ({
	car: one(cars, {
		fields: [inspections.carId],
		references: [cars.id]
	}),
	user: one(users, {
		fields: [inspections.userId],
		references: [users.id]
	}),
}));