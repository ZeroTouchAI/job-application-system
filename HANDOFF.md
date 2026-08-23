# Actions Storage Cleanup — Handoff Notes

## Why this exists
In August 2026 the ZeroTouchAI GitHub account hit 100% of its included Actions storage (0.5GB/month), shared across all repos.

## What was consuming space here
- Small repo, no artifacts — 16 stored runs from the "Sync job postings" workflow.

## What was changed (Aug 22, 2026)
1. Added `.github/workflows/cleanup-actions-storage.yml` — same daily-cleanup pattern used across all ZeroTouchAI repos (keeps 5 most recent runs/workflow + last 7 days, sweeps expired artifacts, `dry_run` supported).
2. The workflow's first scheduled run (03:00 UTC, Aug 23) already trimmed the 11 old runs on its own — no manual deletion was needed. Confirms the automation works end-to-end.

See also: the cross-repo standard (ask for the master copy) — apply the same pattern to any new automation project from day one.
