/**
 * CLI entry point for a full job sync. Run manually with `npm run
 * sync-jobs`, or on a schedule via any free scheduler — e.g. a GitHub
 * Actions cron workflow, a Railway cron job, or a system crontab. This
 * replaces the paid-automation-platform role that Make.com plays in
 * other projects, at no cost.
 *
 * The actual sync logic lives in lib/jobSync.ts, shared with the manual
 * "sync now" API route (app/api/jobs/sync/route.ts) so both entry
 * points run identical logic instead of drifting apart.
 *
 * Example GitHub Actions schedule (see .github/workflows/sync-jobs.yml
 * for the caveat on what "every 3 days" actually means here):
 *   on:
 *     schedule:
 *       - cron: "0 8 */3 * *"
 */

import { db } from "../lib/db";
import { runJobSync } from "../lib/jobSync";

async function main() {
  console.log("Starting job sync...");
  const result = await runJobSync();
  console.log(
    `Fetched ${result.postingsFetched} postings, upserted ${result.postingsUpserted}. ` +
      `${result.suggestionsCreated} suggestions updated/created.`
  );
  await db.$disconnect();
}

main().catch((err) => {
  console.error("Job sync failed:", err);
  process.exit(1);
});
