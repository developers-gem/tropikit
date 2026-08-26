import { Router } from "express";
import destinationRoutes from "./destination.routes";
import authRoutes from "./auth.routes";
import tripRoutes from "./trip.routes";
import checklistRoutes from "./checklist.routes";
import storyRoutes from "./story.routes";
import miscRoutes from "./misc.routes";
import adminRoutes from "./admin.routes";

const router = Router();

router.get("/health", (_req, res) => res.json({ success: true, data: { status: "ok" } }));

router.use("/destinations", destinationRoutes);
router.use("/auth", authRoutes);
router.use("/trips", tripRoutes);
router.use("/checklist", checklistRoutes);
router.use("/stories", storyRoutes);
router.use("/admin", adminRoutes);
router.use("/", miscRoutes);

export default router;
