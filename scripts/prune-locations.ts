// One-off (and re-runnable) cleanup: remove jobs that fall outside each
// user's saved areas. Run from the "Prune jobs outside my areas" GitHub
// Action, which defaults to a dry run so you can see the counts first.
//
//   DRY_RUN=true|false   (default true)
//   PRUNE_PASSED=true|false  also remove passed jobs outside the areas (default true)
//   SINCE=YYYY-MM-DD     also remove everything that entered the system before
//                        this date (applied/interview/offer records are kept)

import { db } from "../lib/db";
import { pruneOld, pruneUser } from "../lib/prune";

async function main() {
  const dryRun = process.env.DRY_RUN !== "false";
  const includePassed = process.env.PRUNE_PASSED !== "false";
  console.log(`Prune ${dryRun ? "(DRY RUN, nothing deleted)" : "(LIVE)"}; passed jobs ${includePassed ? "included" : "kept"}`);

  const users = await db.user.findMany({ select: { id: true, email: true } });
  for (const u of users) {
    const before = await db.application.count({ where: { userId: u.id } });
    const r = await pruneUser(u.id, { includePassed, dryRun });
    const after = dryRun ? before - r.suggested - r.passed : await db.application.count({ where: { userId: u.id } });
    console.log(
      `${u.email}: ${before} jobs; ${dryRun ? "would remove" : "removed"} ${r.suggested} unswiped and ${r.passed} passed; ${dryRun ? "would leave" : "left"} ${after}`
    );
  }

  const since = (process.env.SINCE || "").trim();
  if (since) {
    const cutoff = new Date(`${since}T00:00:00.000Z`);
    if (Number.isNaN(cutoff.getTime())) throw new Error(`SINCE is not a date: ${since}`);
    const r = await pruneOld({ cutoff, dryRun });
    console.log(
      `Before ${since}: ${dryRun ? "would remove" : "removed"} ${r.applications} job records and ${r.postings} old postings; kept ${r.keptApplied} applied/interview/offer records`
    );
  }

  await db.$disconnect();
}

main().catch((err) => {
  console.error("Prune failed:", err);
  process.exit(1);
});
