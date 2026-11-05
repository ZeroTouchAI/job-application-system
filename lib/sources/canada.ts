/**
 * Canada-only gate. J's decision (Nov 2026): Canada first, US paused.
 * Applied to every source in lib/jobSync.ts unless CANADA_ONLY=false.
 */

const PROVINCE_ABBR = /,\s*(ON|BC|AB|QC|MB|SK|NS|NB|NL|PE|NT|YT|NU)\b/;

const CANADA_WORDS =
  /canada|ontario|british columbia|alberta|quebec|québec|manitoba|saskatchewan|nova scotia|new brunswick|newfoundland|prince edward|toronto|vancouver|montreal|montréal|calgary|edmonton|ottawa|winnipeg|halifax|waterloo|kitchener|mississauga|brampton|hamilton|london, on|victoria, bc|saskatoon|regina|markham|pickering|ajax|oshawa/i;

// Remote postings that name a non-Canadian region are not open to Canada.
const NON_CANADA_REGION =
  /united states|\bUSA?\b|\bU\.S\.|europe|emea|united kingdom|\bUK\b|apac|latam|india|australia/;

export function isCanadian(location: string | null, remote: boolean): boolean {
  if (location && (PROVINCE_ABBR.test(location) || CANADA_WORDS.test(location))) {
    return true;
  }
  if (remote && (!location || !NON_CANADA_REGION.test(location))) return true;
  return false;
}

export function canadaOnly(): boolean {
  return process.env.CANADA_ONLY !== "false";
}
