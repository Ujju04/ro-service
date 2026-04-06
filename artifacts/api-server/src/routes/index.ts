import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import bookingsRouter from "./bookings.js";
import techniciansRouter from "./technicians.js";
import productsRouter from "./products.js";
import pricingRouter from "./pricing.js";
import reviewsRouter from "./reviews.js";
import chatRouter from "./chat.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", authRouter);
router.use("/bookings", bookingsRouter);
router.use("/technicians", techniciansRouter);
router.use(productsRouter);
router.use("/pricing", pricingRouter);
router.use("/water-quality", pricingRouter);
router.use("/reviews", reviewsRouter);
router.use("/chat", chatRouter);

export default router;
