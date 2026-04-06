import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, usersTable, techniciansTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireUser } from "../middlewares/auth.js";
import { AuthRequest } from "../middlewares/auth.js";

const router = Router();

// Create review
router.post("/", requireUser as any, async (req: AuthRequest, res) => {
  try {
    const { technicianId, bookingId, rating, comment } = req.body;
    if (!technicianId || !bookingId || !rating) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const [review] = await db.insert(reviewsTable).values({
      userId: req.userId!,
      technicianId,
      bookingId,
      rating,
      comment,
    }).returning();

    // Update technician average rating
    const reviews = await db.select({ rating: reviewsTable.rating }).from(reviewsTable).where(eq(reviewsTable.technicianId, technicianId));
    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await db.update(techniciansTable)
      .set({ rating: avgRating.toFixed(2) })
      .where(eq(techniciansTable.id, technicianId));

    const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, req.userId!));
    res.status(201).json({ ...review, userName: user?.name });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get reviews for a technician
router.get("/technician/:technicianId", async (req, res) => {
  try {
    const technicianId = parseInt(req.params.technicianId);
    const reviews = await db
      .select({
        id: reviewsTable.id,
        userId: reviewsTable.userId,
        technicianId: reviewsTable.technicianId,
        bookingId: reviewsTable.bookingId,
        rating: reviewsTable.rating,
        comment: reviewsTable.comment,
        createdAt: reviewsTable.createdAt,
        userName: usersTable.name,
      })
      .from(reviewsTable)
      .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
      .where(eq(reviewsTable.technicianId, technicianId))
      .orderBy(reviewsTable.createdAt);

    res.json(reviews);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
