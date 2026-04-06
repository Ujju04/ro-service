import { pgTable, serial, integer, text, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable, techniciansTable } from "./users";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  technicianId: integer("technician_id").references(() => techniciansTable.id),
  serviceType: text("service_type").notNull(), // repair, installation, amc, inspection
  status: text("status").default("pending").notNull(), // pending, accepted, in_progress, completed, cancelled, rejected
  bookingType: text("booking_type").notNull(), // instant, scheduled
  scheduledAt: timestamp("scheduled_at"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  description: text("description"),
  symptoms: text("symptoms"),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  estimatedCost: numeric("estimated_cost", { precision: 10, scale: 2 }),
  serviceCharge: numeric("service_charge", { precision: 10, scale: 2 }).default("199"),
  finalAmount: numeric("final_amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bookingPartsTable = pgTable("booking_parts", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookingsTable.id),
  partId: integer("part_id").notNull(),
  partName: text("part_name").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true, finalAmount: true, technicianId: true });

export type Booking = typeof bookingsTable.$inferSelect;
export type InsertBooking = typeof bookingsTable.$inferInsert;
export type BookingPart = typeof bookingPartsTable.$inferSelect;
