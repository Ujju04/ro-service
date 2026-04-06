import { pgTable, serial, text, integer, numeric, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { usersTable } from "./users";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // ro_system, filter, purifier, accessory
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  brand: text("brand"),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("4.0"),
  imageUrl: text("image_url"),
  features: json("features").$type<string[]>().default([]),
  inStock: boolean("in_stock").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const partsTable = pgTable("parts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  minPrice: numeric("min_price", { precision: 10, scale: 2 }).notNull(),
  maxPrice: numeric("max_price", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const amcPlansTable = pgTable("amc_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // months
  servicesIncluded: integer("services_included").default(2).notNull(),
  features: json("features").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true).notNull(),
});

export const amcSubscriptionsTable = pgTable("amc_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  planId: integer("plan_id").notNull().references(() => amcPlansTable.id),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").default("active").notNull(), // active, expired, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  technicianId: integer("technician_id").notNull(),
  bookingId: integer("booking_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Product = typeof productsTable.$inferSelect;
export type Part = typeof partsTable.$inferSelect;
export type AmcPlan = typeof amcPlansTable.$inferSelect;
export type AmcSubscription = typeof amcSubscriptionsTable.$inferSelect;
export type Review = typeof reviewsTable.$inferSelect;
