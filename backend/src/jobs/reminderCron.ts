// backend/src/jobs/reminderCron.ts
import cron from "node-cron";
import { Reminder } from "../models/Reminder";
import { sendReminderEmail } from "../services/emailService";

export async function processDueReminders() {
  const now = new Date();

  try {
    // Populate user to get their email and name, and trip to get destination details
    const dueReminders = await Reminder.find({
      sent: { $ne: true },
      scheduledFor: { $lte: now },
    })
      .populate<{ userId: { email: string; name?: string; displayName?: string } }>("userId", "email name displayName")
      .populate<{ tripId: { destinationName?: string } }>("tripId", "destinationName")
      .limit(50);

    if (!dueReminders.length) {
      return;
    }

    console.log(`[ReminderCron] Found ${dueReminders.length} due reminder(s) to process.`);

    for (const item of dueReminders) {
      const user = item.userId;
      if (!user || !user.email) {
        // Mark as sent or skipped if user account no longer exists
        item.sent = true;
        await item.save();
        continue;
      }

      const userName = user.name || user.displayName || "Traveler";
      const destinationName = item.tripId?.destinationName;

      const dispatched = await sendReminderEmail({
        to: user.email,
        userName,
        title: item.label,
        category: item.type,
        tripId: item.tripId?._id ? String(item.tripId._id) : String(item.tripId),
        destinationName,
      });

      if (dispatched) {
        item.sent = true;
        item.sentAt = new Date();
        await item.save();
        console.log(`[ReminderCron] Successfully sent "${item.label}" to ${user.email}`);
      }
    }
  } catch (error) {
    console.error("[ReminderCron] Error checking due reminders:", error);
  }
}

// Runs every hour at minute 0 (e.g. 1:00, 2:00, etc.)
export function startReminderScheduler() {
  console.log("[ReminderCron] Initializing hourly reminder dispatch scheduler...");
  cron.schedule("0 * * * *", () => {
    processDueReminders();
  });
}


