import { Router } from "express";
import authRoutes from "./auth.routes";
import dashboardRoutes from "./dashboard.routes";
import escrowRoutes from "./escrow.routes";
import listingsRoutes from "./listings.routes";
import messagesRoutes from "./messages.routes";
import offersRoutes from "./offers.routes";
import uploadsRoutes from "./uploads.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/listings", listingsRoutes);
router.use("/uploads", uploadsRoutes);
router.use("/offers", offersRoutes);
router.use("/messages", messagesRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/escrow", escrowRoutes);

export default router;
