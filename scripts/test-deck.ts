import assert from "node:assert/strict";
import {
  applyModeFor,
  attributionFor,
  dropRepeats,
  isSwipeDir,
  remainingToday,
  summarize,
  swipeUpdate,
  toDeckCard,
} from "../lib/deck";
import { sourcesForCountry } from "../lib/sources/registry";

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok  ${name}`);
}

test("swipe directions validate", () => {
  assert.equal(isSwipeDir("right"), true);
  assert.equal(isSwipeDir("left"), true);
  assert.equal(isSwipeDir("up"), true);
  assert.equal(isSwipeDir("down"), false);
  assert.equal(isSwipeDir(undefined), false);
});

test("left swipe rejects, right queues, up queues as top pick", () => {
  assert.deepEqual(swipeUpdate("left"), { status: "rejected", swipe: "left", topPick: false });
  assert.deepEqual(swipeUpdate("right"), { status: "queued", swipe: "right", topPick: false });
  assert.deepEqual(swipeUpdate("up"), { status: "queued", swipe: "up", topPick: true });
});

test("daily cap never goes negative", () => {
  assert.equal(remainingToday(0, 10), 10);
  assert.equal(remainingToday(4, 10), 6);
  assert.equal(remainingToday(10, 10), 0);
  assert.equal(remainingToday(25, 10), 0);
});

test("listed email wins over source default", () => {
  assert.equal(
    applyModeFor({ source: "greenhouse", applyUrl: "https://x", applyEmail: "jobs@x.com" }),
    "email"
  );
});

test("apply mode comes from the registry", () => {
  assert.equal(applyModeFor({ source: "greenhouse", applyUrl: "u", applyEmail: null }), "prefill");
  assert.equal(applyModeFor({ source: "usajobs", applyUrl: "u", applyEmail: null }), "official-only");
  assert.equal(applyModeFor({ source: "arbeitnow", applyUrl: "u", applyEmail: null }), "link");
  assert.equal(applyModeFor({ source: "some-rss-feed", applyUrl: "u", applyEmail: null }), "link");
});

test("USAJobs cards carry the non-affiliation notice", () => {
  assert.match(attributionFor("usajobs") ?? "", /Not operated, sponsored or endorsed by OPM/);
  assert.equal(attributionFor("greenhouse"), null);
});

test("repeats of acted-on jobs are dropped, order preserved", () => {
  const out = dropRepeats(
    [
      { title: "Analyst", company: "Acme", n: 1 },
      { title: "  analyst ", company: "ACME", n: 2 },
      { title: "Planner", company: "Acme", n: 3 },
      { title: "Planner", company: "Acme", n: 4 },
      { title: "Clerk", company: "Beta", n: 5 },
    ],
    [{ title: "Clerk", company: "beta" }]
  );
  assert.deepEqual(out.map((o) => o.n), [1, 3]);
});

test("summaries trim on word boundaries", () => {
  const long = "word ".repeat(200);
  const s = summarize(long, 50);
  assert.ok(s.length <= 51);
  assert.ok(s.endsWith("…"));
  assert.equal(summarize("short text"), "short text");
});

test("deck card maps a posting and limits chips", () => {
  const card = toDeckCard({
    id: "a1",
    matchScore: 80,
    keywordsMatched: ["a", "bb", "ccc", "dddd", "eeeee", "ffffff"],
    keywordsMissing: ["x"],
    jobPosting: {
      title: "T",
      company: "C",
      location: null,
      remote: true,
      source: "usajobs",
      rawText: "hello",
      applyUrl: "u",
      applyEmail: null,
      fetchedAt: new Date("2026-11-01T00:00:00Z"),
    },
  });
  assert.equal(card.keywordsMatched.length, 4);
  assert.equal(card.keywordsMatched[0], "ffffff");
  assert.equal(card.applyMode, "official-only");
  assert.equal(card.applyModeLabel, "Official site");
  assert.equal(card.postedAt, "2026-11-01T00:00:00.000Z");
});

test("country filter only returns sources confirmed for that country", () => {
  const us = sourcesForCountry("US").map((s) => s.id).sort();
  const ca = sourcesForCountry("CA").map((s) => s.id).sort();
  assert.deepEqual(us, ["greenhouse", "lever", "usajobs"]);
  assert.deepEqual(ca, ["greenhouse", "lever"]);
});

console.log(`\n${passed} checks passed`);
