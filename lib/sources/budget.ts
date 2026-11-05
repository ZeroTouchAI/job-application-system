/**
 * Spend guard for paid sources (Apify).
 *
 * Stateless on purpose: instead of tracking month-to-date spend in the DB
 * (which needs a schema change), every run gets a hard cap of
 * MONTHLY_BUDGET / RUNS_PER_MONTH. Even if every run hits its cap, the month
 * cannot exceed the budget. Apify also enforces the cap server-side via
 * `maxTotalChargeUsd`, and you should set a monthly usage limit on the Apify
 * account itself as a second line of defence.
 *
 * Defaults match docs/budget.md:
 *   $4.50 / month, sync every 3rd day of the month => at most 11 runs/month,
 *   $3 per 1,000 results (ASSUMED until the chosen actor is tested).
 */

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export interface RunBudget {
  monthlyBudgetUsd: number;
  runsPerMonth: number;
  /** Hard cap passed to Apify as maxTotalChargeUsd. */
  perRunUsd: number;
  /** Cap on result items per run, derived from the assumed price. */
  maxItems: number;
  pricePer1000Usd: number;
}

export function getRunBudget(): RunBudget {
  const monthlyBudgetUsd = num("APIFY_MONTHLY_BUDGET_USD", 4.5);
  const runsPerMonth = Math.ceil(num("APIFY_RUNS_PER_MONTH", 11));
  const pricePer1000Usd = num("APIFY_PRICE_PER_1000_USD", 3);

  // Floor to the cent so rounding can never push the total over budget.
  const perRunUsd = Math.floor((monthlyBudgetUsd / runsPerMonth) * 100) / 100;
  const maxItems = Math.max(
    0,
    Math.floor((perRunUsd / pricePer1000Usd) * 1000)
  );

  return { monthlyBudgetUsd, runsPerMonth, perRunUsd, maxItems, pricePer1000Usd };
}
