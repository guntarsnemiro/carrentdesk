/** Keep rendered <title> under ~60 chars (Google SERP display limit). */
export function seoPageTitle(base: string, maxLen = 55): string {
  if (base.length <= maxLen) return base;
  return `${base.slice(0, maxLen - 1).trimEnd()}…`;
}
