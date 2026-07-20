import Parser from "rss-parser";
import type { RawPosting } from "./arbeitnow";

/**
 * Generic RSS connector for any job board that publishes a feed. Standard
 * feed parsing — no ToS conflict since the board is choosing to publish it.
 */

const parser = new Parser();

export async function fetchRssJobs(
  feedUrl: string,
  sourceName = "rss"
): Promise<RawPosting[]> {
  const feed = await parser.parseURL(feedUrl);

  return (feed.items || []).map((item) => ({
    source: sourceName,
    sourceId: item.guid || item.link || item.title || crypto.randomUUID(),
    title: item.title || "Untitled posting",
    company: extractCompanyGuess(item.title, feed.title),
    location: null,
    remote: /remote/i.test(item.title || item.contentSnippet || ""),
    rawText: item.contentSnippet || item.content || "",
    applyUrl: item.link || null,
    applyEmail: null,
  }));
}

/**
 * RSS feeds don't have a standard "company" field, so this makes a best
 * effort at extracting one from common title formats like
 * "Software Engineer at Acme Corp" — falls back to the feed's own title.
 */
function extractCompanyGuess(
  title?: string,
  feedTitle?: string
): string {
  if (title) {
    const match = title.match(/\bat\s+(.+)$/i);
    if (match) return match[1].trim();
  }
  return feedTitle || "Unknown";
}
