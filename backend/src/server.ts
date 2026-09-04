// backend/src/server.ts
import { createApp } from "./app";
import { connectDatabase } from "./config/db";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { startReminderScheduler } from "./jobs/reminderCron";

async function main() {
  await connectDatabase();

  // Initialize the background cron scheduler for due email reminders
  startReminderScheduler();

  const app = createApp();

  app.listen(env.port, () => {
    logger.info(`Tropikit API listening on port ${env.port} (${env.nodeEnv})`);
  });
}

main().catch((err) => {
  logger.error("Fatal error during startup", err);
  process.exit(1);
});