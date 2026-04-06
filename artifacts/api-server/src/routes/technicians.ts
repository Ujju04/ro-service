import { Router } from "express";
import { db } from "@workspace/db";
import { techniciansTable, bookingsTable, usersTable, reviewsTable } from "@workspace/db/schema";
import { eq, and, or, isNull, sql } from "drizzle-orm";
import { requireTechnician } from "../middlewares/auth.js";
import { AuthRequest } from "../middlewares/auth.js";

const router = Router();

// Get nearby technicians (public)
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    // Return all available technicians, ordered by closest (using simple distance formula)
    const techs = await db.select({
      id: techniciansTable.id,
      name: techniciansTable.name,
      email: techniciansTable.email,
      phone: techniciansTable.phone,
      experience: techniciansTable.experience,
      city: techniciansTable.city,
      address: techniciansTable.address,
      lat: techniciansTable.lat,
      lng: techniciansTable.lng,
      isAvailable: techniciansTable.isAvailable,
      rating: techniciansTable.rating,
      totalJobs: techniciansTable.totalJobs,
      createdAt: techniciansTable.createdAt,
    }).from(techniciansTable)
      .where(and(eq(techniciansTable.isAvailable, true), eq(techniciansTable.isActive, true)))
      .limit(10);
    res.json(techs);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get technician profile
router.get("/me", requireTechnician as any, async (req: AuthRequest, res) => {
  try {
    const [tech] = await db.select({
      id: techniciansTable.id,
      name: techniciansTable.name,
      email: techniciansTable.email,
      phone: techniciansTable.phone,
      experience: techniciansTable.experience,
      city: techniciansTable.city,
      address: techniciansTable.address,
      lat: techniciansTable.lat,
      lng: techniciansTable.lng,
      isAvailable: techniciansTable.isAvailable,
      rating: techniciansTable.rating,
      totalJobs: techniciansTable.totalJobs,
      createdAt: techniciansTable.createdAt,
    }).from(techniciansTable).where(eq(techniciansTable.id, req.technicianId!)).limit(1);
    if (!tech) { res.status(404).json({ error: "Not found" }); return; }
    res.json(tech);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update technician profile
router.patch("/me", requireTechnician as any, async (req: AuthRequest, res) => {
  try {
    const { name, phone, address, city, lat, lng } = req.body;
    const [tech] = await db.update(techniciansTable)
      .set({ name, phone, address, city, lat: lat?.toString(), lng: lng?.toString(), updatedAt: new Date() })
      .where(eq(techniciansTable.id, req.technicianId!))
      .returning();
    res.json({ id: tech.id, name: tech.name, email: tech.email, phone: tech.phone, experience: tech.experience, city: tech.city, isAvailable: tech.isAvailable, rating: tech.rating, totalJobs: tech.totalJobs, createdAt: tech.createdAt });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update availability
router.patch("/me/availability", requireTechnician as any, async (req: AuthRequest, res) => {
  try {
    const { isAvailable } = req.body || {};
    const [tech] = await db.update(techniciansTable)
      .set({ isAvailable, updatedAt: new Date() })
      .where(eq(techniciansTable.id, req.technicianId!))
      .returning();
    res.json({ id: tech.id, name: tech.name, email: tech.email, phone: tech.phone, experience: tech.experience, city: tech.city, isAvailable: tech.isAvailable, rating: tech.rating, totalJobs: tech.totalJobs, createdAt: tech.createdAt });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get technician bookings
// - All open (unassigned, pending) bookings visible to every technician
// - Plus this technician's own accepted/active/completed bookings
router.get("/me/bookings", requireTechnician as any, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;

    let whereClause: any;

    if (status && status !== "pending") {
      // Specific non-pending status: only their own bookings with that status
      whereClause = and(
        eq(bookingsTable.technicianId, req.technicianId!),
        eq(bookingsTable.status, status as string)
      );
    } else if (status === "pending") {
      // Pending: all unassigned pending bookings (open pool)
      whereClause = and(
        eq(bookingsTable.status, "pending"),
        isNull(bookingsTable.technicianId)
      );
    } else {
      // No filter: open pending pool + own bookings
      whereClause = or(
        and(eq(bookingsTable.status, "pending"), isNull(bookingsTable.technicianId)),
        eq(bookingsTable.technicianId, req.technicianId!)
      );
    }

    const bookings = await db
      .select({
        id: bookingsTable.id,
        userId: bookingsTable.userId,
        technicianId: bookingsTable.technicianId,
        serviceType: bookingsTable.serviceType,
        status: bookingsTable.status,
        bookingType: bookingsTable.bookingType,
        scheduledAt: bookingsTable.scheduledAt,
        address: bookingsTable.address,
        city: bookingsTable.city,
        description: bookingsTable.description,
        symptoms: bookingsTable.symptoms,
        estimatedCost: bookingsTable.estimatedCost,
        serviceCharge: bookingsTable.serviceCharge,
        finalAmount: bookingsTable.finalAmount,
        createdAt: bookingsTable.createdAt,
        userName: usersTable.name,
        userPhone: usersTable.phone,
      })
      .from(bookingsTable)
      .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
      .where(whereClause)
      .orderBy(bookingsTable.createdAt);

    res.json(bookings);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get earnings summary
router.get("/me/earnings", requireTechnician as any, async (req: AuthRequest, res) => {
  try {
    const allBookings = await db
      .select({
        id: bookingsTable.id,
        userId: bookingsTable.userId,
        technicianId: bookingsTable.technicianId,
        serviceType: bookingsTable.serviceType,
        status: bookingsTable.status,
        bookingType: bookingsTable.bookingType,
        scheduledAt: bookingsTable.scheduledAt,
        address: bookingsTable.address,
        city: bookingsTable.city,
        description: bookingsTable.description,
        symptoms: bookingsTable.symptoms,
        estimatedCost: bookingsTable.estimatedCost,
        serviceCharge: bookingsTable.serviceCharge,
        finalAmount: bookingsTable.finalAmount,
        createdAt: bookingsTable.createdAt,
        userName: usersTable.name,
        userPhone: usersTable.phone,
      })
      .from(bookingsTable)
      .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
      .where(eq(bookingsTable.technicianId, req.technicianId!));

    const completed = allBookings.filter(b => b.status === "completed");
    const pending = allBookings.filter(b => ["pending", "accepted"].includes(b.status));
    const totalEarnings = completed.reduce((sum, b) => sum + parseFloat(b.finalAmount?.toString() || "0"), 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEarnings = completed
      .filter(b => new Date(b.createdAt) >= monthStart)
      .reduce((sum, b) => sum + parseFloat(b.finalAmount?.toString() || "0"), 0);

    // Get average rating
    const tech = await db.select({ rating: techniciansTable.rating }).from(techniciansTable).where(eq(techniciansTable.id, req.technicianId!)).limit(1);
    
    res.json({
      totalEarnings,
      thisMonthEarnings,
      totalJobs: allBookings.length,
      completedJobs: completed.length,
      pendingJobs: pending.length,
      averageRating: parseFloat(tech[0]?.rating?.toString() || "0"),
      recentBookings: allBookings.slice(-5).reverse(),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
