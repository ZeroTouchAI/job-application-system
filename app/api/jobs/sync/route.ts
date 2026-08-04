import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { runJobSync } from "../../../../lib/jobSync";

// Manual syncs call out to several external job-board APIs and then
// re-score every posting against every user's profile, which can run
// long on a cold start. Give it more room than the default serverless
// timeout (only takes effect on plans that honor maxDuration, e.g.
// Vercel Pro; the Hobby plan caps at 10s regardless).
export const maxDuration = 60;

/**
 * Manual "sync now" trigger for the dashboard. Runs the same logic as
 * the scheduled cron job (scripts/sync-jobs.ts, see
 * .github/workflows/sync-jobs.yml) via the shared lib/jobSync.ts
 * module, so a manual sync and a scheduled sync behave identically.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runJobSync();
    return NextResponse.json({
      message: `Synced ${result.postingsUpserted} postings, ${result.suggestionsCreated} suggestions updated.`,
      ...result,
    });
  } catch (err) {
    console.error("Manual job sync failed:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
