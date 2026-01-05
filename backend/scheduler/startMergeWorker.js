import cron from "node-cron";
import { startMergeWorker } from "../workers/startMergeWorker.js";

// ⏱ every 6 hours
// cron.schedule("0 */6 * * *", startMergeWorker);

// ⏱ every day at 7:00 AM
cron.schedule("0 7 * * *", startMergeWorker);

// startMergeWorker()