import { Router } from "express";
import { processDueReminders } from "../jobs/reminderCron";

const router = Router();

router.get("/cron/process-reminders", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  await processDueReminders();
  return res.json({ success: true, processedAt: new Date().toISOString() });
});

export default router;