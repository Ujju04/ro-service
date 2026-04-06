import { pgTable, serial, text, timestamp, boolean, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  address: text("address"),
  city: text("city"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const techniciansTable = pgTable("technicians", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  experience: integer("experience").default(0),
  city: text("city").notNull(),
  address: text("address"),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  isAvailable: boolean("is_available").default(false).notNull(),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("4.5"),
  totalJobs: integer("total_jobs").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, passwordHash: true, createdAt: true, updatedAt: true });
export const insertTechnicianSchema = createInsertSchema(techniciansTable).omit({ id: true, passwordHash: true, createdAt: true, updatedAt: true, rating: true, totalJobs: true });

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
export type Technician = typeof techniciansTable.$inferSelect;
export type InsertTechnician = typeof techniciansTable.$inferInsert;
