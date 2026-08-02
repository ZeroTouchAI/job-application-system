import type { RawPosting } from "./arbeitnow";

/**
 * USAJobs — the official U.S. federal government job board's public API.
 * Free, requires a self-service API key (register at
 * https://developer.usajobs.gov). Legitimate public API, no ToS conflict.
 *
 * Auth is header-based, not a query param: Host, User-Agent (your
 * registered email — not a browser string), and Authorization-Key.
 * Silently returns no results if USAJOBS_API_KEY / USAJOBS_USER_AGENT
 * aren't configured, rather than erroring the whole sync.
 */

interface UsaJobsResultItem {
  MatchedObjectId: string;
  MatchedObjectDescriptor: {
    PositionTitle: string;
    OrganizationName: string;
    PositionLocationDisplay?: string;
    PositionURI?: string;
    ApplyURI?: string[];
    UserArea?: { Details?: { JobSummary?: string } };
  };
}

interface UsaJobsResponse {
  SearchResult?: { SearchResultItems?: UsaJobsResultItem[] };
}

export async function fetchUsaJobs(params: {
  keyword?: string;
  location?: string;
}): Promise<RawPosting[]> {
  const apiKey = process.env.USAJOBS_API_KEY;
  const userAgent = process.env.USAJOBS_USER_AGENT;
  if (!apiKey || !userAgent) return [];

  const url = new URL("https://data.usajobs.gov/api/search");
  if (params.keyword) url.searchParams.set("Keyword", params.keyword);
  if (params.location) url.searchParams.set("LocationName", params.location);
  url.searchParams.set("ResultsPerPage", "50");

  const res = await fetch(url.toString(), {
    headers: {
      Host: "data.usajobs.gov",
      "User-Agent": userAgent,
      "Authorization-Key": apiKey,
    },
  });

  if (!res.ok) {
    throw new Error(`USAJobs API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as UsaJobsResponse;
  const items = json.SearchResult?.SearchResultItems || [];

  return items.map((item) => {
    const d = item.MatchedObjectDescriptor;
    return {
      source: "usajobs",
      sourceId: item.MatchedObjectId,
      title: d.PositionTitle,
      company: d.OrganizationName,
      location: d.PositionLocationDisplay || null,
      remote: /remote|nationwide|telework/i.test(d.PositionLocationDisplay || ""),
      rawText: d.UserArea?.Details?.JobSummary || d.PositionTitle,
      applyUrl: d.ApplyURI?.[0] || d.PositionURI || null,
      applyEmail: null,
    };
  });
}
