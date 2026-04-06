import { Router } from "express";
import { db } from "@workspace/db";
import { bookingsTable, bookingPartsTable, techniciansTable, usersTable, partsTable } from "@workspace/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { requireUser, requireTechnician, requireAuth, AuthRequest } from "../middlewares/auth.js";

const router = Router();

const SERVICE_CHARGE = 199;

// Create booking — no auto-assignment, stays open for any technician to accept
router.post("/", requireUser as any, async (req: AuthRequest, res) => {
  try {
    const { serviceType, bookingType, scheduledAt, address, city, description, symptoms, lat, lng } = req.body;

    if (!serviceType || !bookingType || !address || !city) {
      res.status(400).json({ error: "Bad request", message: "Missing required fields" });
      return;
    }

    const [booking] = await db.insert(bookingsTable).values({
      userId: req.userId!,
      technicianId: null,          // unassigned — any technician can accept
      serviceType,
      status: "pending",
      bookingType,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      address,
      city,
      description,
      symptoms,
      lat: lat?.toString(),
      lng: lng?.toString(),
      serviceCharge: SERVICE_CHARGE.toString(),
    }).returning();

    const [user] = await db.select({ name: usersTable.name, phone: usersTable.phone })
      .from(usersTable).where(eq(usersTable.id, req.userId!));

    res.status(201).json({ ...booking, userName: user?.name, userPhone: user?.phone, technicianName: null, partsUsed: [] });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user bookings
router.get("/", requireUser as any, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;
    const conditions: any[] = [eq(bookingsTable.userId, req.userId!)];
    if (status) conditions.push(eq(bookingsTable.status, status as string));

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
        technicianName: techniciansTable.name,
      })
      .from(bookingsTable)
      .leftJoin(techniciansTable, eq(bookingsTable.technicianId, techniciansTable.id))
      .where(and(...conditions))
      .orderBy(bookingsTable.createdAt);

    const result = await Promise.all(bookings.map(async (b) => {
      const parts = await db.select().from(bookingPartsTable).where(eq(bookingPartsTable.bookingId, b.id));
      return { ...b, partsUsed: parts };
    }));

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get booking by ID
router.get("/:id", requireAuth as any, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [booking] = await db
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
        technicianName: techniciansTable.name,
        userName: usersTable.name,
        userPhone: usersTable.phone,
      })
      .from(bookingsTable)
      .leftJoin(techniciansTable, eq(bookingsTable.technicianId, techniciansTable.id))
      .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
      .where(eq(bookingsTable.id, id))
      .limit(1);

    if (!booking) { res.status(404).json({ error: "Not found" }); return; }

    const parts = await db.select().from(bookingPartsTable).where(eq(bookingPartsTable.bookingId, id));
    res.json({ ...booking, partsUsed: parts });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update booking status (technician during service — in_progress, completed, cancelled)
router.patch("/:id/status", requireTechnician as any, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body || {};

    if (!["in_progress", "completed", "cancelled"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }

    const [booking] = await db.update(bookingsTable)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(bookingsTable.id, id), eq(bookingsTable.technicianId, req.technicianId!)))
      .returning();

    if (!booking) { res.status(404).json({ error: "Not found or not authorized" }); return; }

    res.json({ ...booking, partsUsed: [] });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Accept booking — first technician to accept wins (atomic check: must still be unassigned & pending)
router.post("/:id/accept", requireTechnician as any, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);

    // Atomically claim: only succeeds if still unassigned and pending
    const [booking] = await db.update(bookingsTable)
      .set({ status: "accepted", technicianId: req.technicianId!, updatedAt: new Date() })
      .where(and(
        eq(bookingsTable.id, id),
        eq(bookingsTable.status, "pending"),
        isNull(bookingsTable.technicianId)
      ))
      .returning();

    if (!booking) {
      res.status(409).json({ error: "This job has already been claimed by another technician" });
      return;
    }

    res.json({ ...booking, partsUsed: [] });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reject booking — technician passes, job stays open for others
router.post("/:id/reject", requireTechnician as any, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);

    // Just verify the booking exists and is still pending/unassigned
    const [existing] = await db.select({ id: bookingsTable.id, status: bookingsTable.status })
      .from(bookingsTable)
      .where(and(eq(bookingsTable.id, id), eq(bookingsTable.status, "pending"), isNull(bookingsTable.technicianId)))
      .limit(1);

    if (!existing) {
      res.status(409).json({ error: "This job is no longer available" });
      return;
    }

    // Job stays pending and unassigned — technician simply doesn't take it
    res.json({ id, status: "pending", message: "Job skipped — still available for other technicians" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Generate bill
router.post("/:id/bill", requireTechnician as any, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { parts = [], serviceCharge, notes } = req.body || {};

    let partsTotal = 0;
    const billParts: any[] = [];

    for (const p of parts) {
      const [part] = await db.select().from(partsTable).where(eq(partsTable.id, p.partId)).limit(1);
      if (!part) continue;
      const unitPrice = parseFloat(part.maxPrice?.toString() || "0");
      const qty = p.quantity || 1;
      const totalPrice = unitPrice * qty;
      partsTotal += totalPrice;

      await db.insert(bookingPartsTable).values({
        bookingId: id,
        partId: p.partId,
        partName: part.name,
        quantity: qty,
        unitPrice: unitPrice.toString(),
        totalPrice: totalPrice.toString(),
      });

      billParts.push({ partId: p.partId, partName: part.name, quantity: qty, unitPrice, totalPrice });
    }

    const totalAmount = partsTotal + (serviceCharge || SERVICE_CHARGE);
    await db.update(bookingsTable)
      .set({ finalAmount: totalAmount.toString(), serviceCharge: serviceCharge?.toString() || SERVICE_CHARGE.toString(), status: "completed", notes, updatedAt: new Date() })
      .where(eq(bookingsTable.id, id));

    res.json({ bookingId: id, parts: billParts, serviceCharge: serviceCharge || SERVICE_CHARGE, partsTotal, totalAmount, notes });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
