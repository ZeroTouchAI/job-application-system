import { db } from "./db";
import { postingAllowed } from "./areas";
import { canadaOnly, isCanadian } from "./sources/canada";

export interface PruneResult {
  suggested: number;
  passed: number;
}

/**
 * Removes jobs that sit outside a user's saved areas (and outside Canada
 * while Canada-only mode is on).
 *
 * Only unswiped suggestions and, when asked, passed jobs are removed.
 * Jobs the user marked interested, drafted, applied, interview or offer are
 * never touched, because those are the user's own actions.
 */
export async function pruneUser(
  userId: string,
  opts: { includePassed: boolean; dryRun: boolean }
): Promise<PruneResult> {
  const searches = await db.searchCriteria.findMany({ where: { userId } });
  const result: PruneResult = { suggested: 0, passed: 0 };
  if (searches.length === 0) return result; // nothing to filter by

  const statuses = opts.includePassed ? ["suggested", "rejected"] : ["suggested"];
  const apps = await db.application.findMany({
    where: { userId, status: { in: statuses } },
    select: { id: true, status: true, jobPosting: { select: { location: true, remote: true } } },
  });

  const onlyCanada = canadaOnly();
  const doomed: { id: string; status: string }[] = [];
  for (const a of apps as { id: string; status: string; jobPosting: { location: string | null; remote: boolean } }[]) {
    const p = a.jobPosting;
    const inArea = postingAllowed(p, searches);
    const inCanada = !onlyCanada || isCanadian(p.location, p.remote);
    if (!inArea || !inCanada) doomed.push({ id: a.id, status: a.status });
  }

  for (const d of doomed) {
    if (d.status === "suggested") result.suggested++;
    else result.passed++;
  }
  if (opts.dryRun || doomed.length === 0) return result;

  for (let i = 0; i < doomed.length; i += 500) {
    await db.application.deleteMany({
      where: { id: { in: doomed.slice(i, i + 500).map((d) => d.id) }, userId },
    });
  }
  return result;
}
