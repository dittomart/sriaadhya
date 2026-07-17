/* CMS HTML sanitization — applied at the data layer so the cache only ever
   holds safe HTML. Part 2 wires this into the brand-policies query. */

export function sanitizeCmsHtml(input: string | null | undefined): string | null {
  if (!input) return null;
  return input
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*\/?>/gi, '')
    .replace(/<meta\b[^>]*\/?>/gi, '')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, '')
    .replace(/<iframe\b[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object\b[\s\S]*?<\/object>/gi, '')
    .replace(/<embed\b[^>]*\/?>/gi, '')
    .replace(/\s(?:style|on[a-z]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/url\s*\(\s*[^)]*\)/gi, '');
}

export function sanitizeCmsHtmlMap<T extends object>(obj: T | null | undefined): T | null {
  if (!obj) return null;
  const out: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === 'string' ? sanitizeCmsHtml(v) : (v as null);
  }
  return out as unknown as T;
}
