"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspectionsRelations = exports.carsRelations = exports.usersRelations = exports.inspections = exports.cars = exports.users = exports.inspectionStatusEnum = exports.carStatusEnum = exports.userRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.userRoleEnum = (0, pg_core_1.pgEnum)('user_role', ['user', 'admin']);
exports.carStatusEnum = (0, pg_core_1.pgEnum)('car_status', ['pending', 'approved']);
exports.inspectionStatusEnum = (0, pg_core_1.pgEnum)('inspection_status', ['pending', 'confirmed']);
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)('name', { length: 255 }).notNull(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    phone: (0, pg_core_1.varchar)('phone', { length: 20 }),
    passwordHash: (0, pg_core_1.varchar)('password_hash', { length: 255 }).notNull(),
    role: (0, exports.userRoleEnum)('role').default('user').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.cars = (0, pg_core_1.pgTable)('cars', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id).notNull(),
    title: (0, pg_core_1.varchar)('title', { length: 255 }).notNull(),
    price: (0, pg_core_1.integer)('price').notNull(),
    brand: (0, pg_core_1.varchar)('brand', { length: 100 }).notNull(),
    model: (0, pg_core_1.varchar)('model', { length: 100 }).notNull(),
    year: (0, pg_core_1.integer)('year').notNull(),
    description: (0, pg_core_1.text)('description'),
    images: (0, pg_core_1.json)('images').$type().default([]),
    status: (0, exports.carStatusEnum)('status').default('pending').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.inspections = (0, pg_core_1.pgTable)('inspections', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.id).notNull(),
    carId: (0, pg_core_1.uuid)('car_id').references(() => exports.cars.id).notNull(),
    date: (0, pg_core_1.timestamp)('date').notNull(),
    notes: (0, pg_core_1.text)('notes'),
    status: (0, exports.inspectionStatusEnum)('status').default('pending').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    cars: many(exports.cars),
    inspections: many(exports.inspections),
}));
exports.carsRelations = (0, drizzle_orm_1.relations)(exports.cars, ({ one, many }) => ({
    user: one(exports.users, {
        fields: [exports.cars.userId],
        references: [exports.users.id],
    }),
    inspections: many(exports.inspections),
}));
exports.inspectionsRelations = (0, drizzle_orm_1.relations)(exports.inspections, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.inspections.userId],
        references: [exports.users.id],
    }),
    car: one(exports.cars, {
        fields: [exports.inspections.carId],
        references: [exports.cars.id],
    }),
}));
//# sourceMappingURL=schema.js.map