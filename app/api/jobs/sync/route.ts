import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";

/**
 * Manual "sync now" trigger for the dashboard. The scheduled version
 * runs via scripts/sync-jobs.ts on a cron (see .github/workflows/sync-jobs.yml);
 * this route lets a logged-in user force an immediate refresh.
 *
 * NOTE: this is a stub. Wire it up to invoke the same logic as
 * scripts/sync-jobs.ts (extract the body of main() into a shared,
 * importable function) once that refactor is done — kept separate here
 * so the sync script stays a simple standalone entry point for the cron
 * job in the meantime.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      message:
        "Manual sync not yet wired up — run `npm run sync-jobs` for now, or wait for the next scheduled sync.",
    },
    { status: 501 }
  );
}
