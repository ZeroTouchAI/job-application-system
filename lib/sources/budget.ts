/**
 * Spend guard for Apify (the only paid source).
 *
 * J's rule: ZeroTouch scraping spend stays under $5/month; target $4.50.
 *
 * Stateless on purpose: the monthly budget is split across the maximum number
 * of sync runs in a month, and each run gets a hard cap. Even if every run
 * hits its cap the month cannot exceed the budget. Apify also enforces the
 * cap server-side via `maxTotalChargeUsd`, and the Apify account has its own
 * monthly limit as a backstop. See docs/budget.md.
 *
 * Prices are the FREE-plan prices on the actor's Store listing as read on
 * 2026-11-05 (agentx/all-jobs-scraper: $0.01 per run start, $0.0035 per
 * result). Override with env if they change.
 */

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export interface BoardsPlan {
  monthlyBudgetUsd: number;
  runsPerMonth: number;
  /** Hard cap for the whole sync run, split across searches. */
  perRunUsd: number;
  /** How many saved searches can be paid for in one run. */
  searches: number;
  /** Hard cap in USD per search (maxTotalChargeUsd). */
  perSearchUsd: number;
  /** Result cap per search (maxItems). */
  maxItemsPerSearch: number;
  startUsd: number;
  resultUsd: number;
}

export function planBoardsRun(searchCount: number, platformCount: number): BoardsPlan {
  const monthlyBudgetUsd = num("APIFY_MONTHLY_BUDGET_USD", 4.5);
  const runsPerMonth = Math.ceil(num("APIFY_RUNS_PER_MONTH", 11));
  const startUsd = num("APIFY_START_PRICE_USD", 0.01);
  const resultUsd = num("APIFY_RESULT_PRICE_USD", 0.0035);

  // Floor to the cent so rounding can never push the total over budget.
  const perRunUsd = Math.floor((monthlyBudgetUsd / runsPerMonth) * 100) / 100;

  // A search is only worth paying for if it can return at least one result
  // per platform on top of the start fee.
  const minPerSearch = startUsd + resultUsd * Math.max(1, platformCount);
  const affordable = Math.floor(perRunUsd / minPerSearch);
  const searches = Math.max(0, Math.min(searchCount, affordable));

  const perSearchUsd =
    searches > 0 ? Math.floor((perRunUsd / searches) * 1000) / 1000 : 0;
  const maxItemsPerSearch =
    searches > 0 ? Math.max(0, Math.floor((perSearchUsd - startUsd) / resultUsd)) : 0;

  return {
    monthlyBudgetUsd,
    runsPerMonth,
    perRunUsd,
    searches,
    perSearchUsd,
    maxItemsPerSearch,
    startUsd,
    resultUsd,
  };
}
