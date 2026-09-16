import { sendWeeklyDigestToAll } from "../../services/weekly-digest.js";

// GET /api/cron/weekly-digest — replaces the node-cron weekly job.
// Scheduled by Vercel Cron (see vercel.json). Protected by CRON_SECRET.
export default defineEventHandler(async (event) => {
  requireCronSecret(event);

  console.log("[cron:weekly-digest] Starting weekly digest job");
  try {
    await sendWeeklyDigestToAll();
    return { ok: true };
  } catch (err) {
    console.error("[cron:weekly-digest] Job error:", err);
    setResponseStatus(event, 500);
    return { ok: false, error: err.message };
  }
});
