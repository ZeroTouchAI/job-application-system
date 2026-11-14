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

export interface PruneOldResult {
  applications: number;
  keptApplied: number;
  postings: number;
}

/**
 * Data retention: removes everything older than `cutoff` (by the date the job
 * entered the system), for every user.
 *
 * Applications the user marked applied, interview or offer are kept, because
 * those are records of real applications; the result reports how many were
 * kept so they can be removed separately if wanted. Job postings older than
 * the cutoff that no longer have any application are removed too.
 */
export async function pruneOld(opts: { cutoff: Date; dryRun: boolean }): Promise<PruneOldResult> {
  const { cutoff, dryRun } = opts;
  const removable = { createdAt: { lt: cutoff }, status: { in: ["suggested", "queued", "drafted", "rejected"] } };

  const applications = await db.application.count({ where: removable });
  const keptApplied = await db.application.count({
    where: { createdAt: { lt: cutoff }, status: { in: ["applied", "interview", "offer"] } },
  });

  if (!dryRun && applications > 0) {
    await db.application.deleteMany({ where: removable });
  }

  // Old postings with no application left (for a dry run, those whose only
  // applications are among the ones that would be removed).
  const stalePostings = await db.jobPosting.findMany({
    where: { fetchedAt: { lt: cutoff } },
    select: { id: true, applications: { select: { status: true, createdAt: true } } },
  });
  const orphanIds: string[] = [];
  for (const p of stalePostings as { id: string; applications: { status: string; createdAt: Date }[] }[]) {
    const survivors = p.applications.filter(
      (a) => !(a.createdAt < cutoff && ["suggested", "queued", "drafted", "rejected"].includes(a.status))
    );
    if (survivors.length === 0) orphanIds.push(p.id);
  }

  if (!dryRun) {
    for (let i = 0; i < orphanIds.length; i += 500) {
      await db.jobPosting.deleteMany({
        where: { id: { in: orphanIds.slice(i, i + 500) }, applications: { none: {} } },
      });
    }
  }

  return { applications, keptApplied, postings: orphanIds.length };
}
