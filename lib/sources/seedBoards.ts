/**
 * Starter list of Canadian-headquartered employers so a new account has cards
 * immediately. Each slug was confirmed to exist with open postings on
 * 2026-11-05 (checked by an existence run, not from memory). Boards that
 * exist but had zero postings that day (wealthsimple, thinkific, benchsci,
 * fellow) are left out. Set SEED_CANADIAN_BOARDS=off to disable.
 *
 * Postings are still filtered to Canada by lib/sources/canada.ts.
 */
export const SEED_BOARDS = {
  greenhouse: ["hootsuite", "faire", "ritual", "d2l", "later", "unbounce", "tailscale"],
  lever: ["wattpad", "achievers", "plooto", "pointclickcare"],
  ashby: [
    "lightspeedhq",
    "cohere",
    "procurify",
    "visier",
    "hopper",
    "jobber",
    "trulioo",
    "clearco",
    "neofinancial",
    "koho",
    "benevity",
    "miovision",
  ],
};
