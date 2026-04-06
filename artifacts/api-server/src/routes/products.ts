import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, partsTable, amcPlansTable, amcSubscriptionsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUser } from "../middlewares/auth.js";
import { AuthRequest } from "../middlewares/auth.js";

const router = Router();

// Get all products
router.get("/products", async (req, res) => {
  try {
    const { category } = req.query;
    const conditions: any[] = [eq(productsTable.inStock, true)];
    if (category) conditions.push(eq(productsTable.category, category as string));

    const products = await db.select().from(productsTable).where(and(...conditions));
    res.json(products);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get product by ID
router.get("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
    if (!product) { res.status(404).json({ error: "Not found" }); return; }
    res.json(product);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get AMC plans
router.get("/amc-plans", async (req, res) => {
  try {
    const plans = await db.select().from(amcPlansTable).where(eq(amcPlansTable.isActive, true));
    res.json(plans);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Subscribe to AMC plan
router.post("/amc-plans/subscribe", requireUser as any, async (req: AuthRequest, res) => {
  try {
    const { planId } = req.body;
    const [plan] = await db.select().from(amcPlansTable).where(eq(amcPlansTable.id, planId)).limit(1);
    if (!plan) { res.status(404).json({ error: "Plan not found" }); return; }

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + plan.duration);

    const [sub] = await db.insert(amcSubscriptionsTable).values({
      userId: req.userId!,
      planId,
      endDate,
      status: "active",
    }).returning();

    const planData = await db.select({ name: amcPlansTable.name }).from(amcPlansTable).where(eq(amcPlansTable.id, planId));
    res.status(201).json({ ...sub, planName: planData[0]?.name });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
