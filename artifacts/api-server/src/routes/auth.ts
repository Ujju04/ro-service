import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, techniciansTable } from "@workspace/db/schema";
import { hashPassword, verifyPassword, signJwt } from "../lib/auth.js";
import { eq } from "drizzle-orm";
import { AuthRequest, requireUser, requireTechnician } from "../middlewares/auth.js";

const router = Router();

// Register customer
router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, address, city } = req.body;
    if (!name || !email || !phone || !password) {
      res.status(400).json({ error: "Bad request", message: "Missing required fields" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Bad request", message: "Email already registered" });
      return;
    }

    const passwordHash = hashPassword(password);
    const [user] = await db.insert(usersTable).values({ name, email, phone, passwordHash, address, city }).returning();
    const token = signJwt({ id: user.id, email: user.email, role: "user" });

    res.status(201).json({
      token,
      role: "user",
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, city: user.city, createdAt: user.createdAt },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login customer
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Bad request", message: "Missing credentials" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }

    const token = signJwt({ id: user.id, email: user.email, role: "user" });
    res.json({
      token,
      role: "user",
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, city: user.city, createdAt: user.createdAt },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Register technician
router.post("/technician/register", async (req, res) => {
  try {
    const { name, email, phone, password, experience, city, address, lat, lng } = req.body;
    if (!name || !email || !phone || !password || !city) {
      res.status(400).json({ error: "Bad request", message: "Missing required fields" });
      return;
    }

    const existing = await db.select().from(techniciansTable).where(eq(techniciansTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Bad request", message: "Email already registered" });
      return;
    }

    const passwordHash = hashPassword(password);
    const [tech] = await db.insert(techniciansTable).values({
      name, email, phone, passwordHash,
      experience: experience || 0,
      city, address,
      lat: lat?.toString(),
      lng: lng?.toString(),
    }).returning();

    const token = signJwt({ id: tech.id, email: tech.email, role: "technician" });
    res.status(201).json({
      token,
      role: "technician",
      technician: { id: tech.id, name: tech.name, email: tech.email, phone: tech.phone, experience: tech.experience, city: tech.city, isAvailable: tech.isAvailable, rating: tech.rating, totalJobs: tech.totalJobs, createdAt: tech.createdAt },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login technician
router.post("/technician/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [tech] = await db.select().from(techniciansTable).where(eq(techniciansTable.email, email)).limit(1);
    if (!tech || !verifyPassword(password, tech.passwordHash)) {
      res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
      return;
    }

    const token = signJwt({ id: tech.id, email: tech.email, role: "technician" });
    res.json({
      token,
      role: "technician",
      technician: { id: tech.id, name: tech.name, email: tech.email, phone: tech.phone, experience: tech.experience, city: tech.city, isAvailable: tech.isAvailable, rating: tech.rating, totalJobs: tech.totalJobs, createdAt: tech.createdAt },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get user profile
router.get("/users/me", requireUser as any, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, city: user.city, createdAt: user.createdAt });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user profile
router.patch("/users/me", requireUser as any, async (req: AuthRequest, res) => {
  try {
    const { name, phone, address, city } = req.body;
    const [user] = await db.update(usersTable)
      .set({ name, phone, address, city, updatedAt: new Date() })
      .where(eq(usersTable.id, req.userId!))
      .returning();
    res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, city: user.city, createdAt: user.createdAt });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
