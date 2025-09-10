-- Migration to convert from serial IDs to UUIDs
-- WARNING: This will delete all existing data (suitable for development)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS inspections;
DROP TABLE IF EXISTS cars;
DROP TABLE IF EXISTS users;

-- Drop and recreate enums to ensure clean state
DROP TYPE IF EXISTS "public"."car_status";
DROP TYPE IF EXISTS "public"."inspection_status";
DROP TYPE IF EXISTS "public"."user_role";

CREATE TYPE "public"."car_status" AS ENUM('pending', 'approved');
CREATE TYPE "public"."inspection_status" AS ENUM('pending', 'confirmed');
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');

-- Create new tables with UUID primary keys
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE "cars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"price" integer NOT NULL,
	"brand" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"year" integer NOT NULL,
	"description" text,
	"images" json DEFAULT '[]'::json,
	"status" "car_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "inspections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"car_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"notes" text,
	"status" "inspection_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "cars" ADD CONSTRAINT "cars_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_car_id_cars_id_fk" FOREIGN KEY ("car_id") REFERENCES "public"."cars"("id") ON DELETE no action ON UPDATE no action;