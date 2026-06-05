// SSOT SEO analysis — pure function reused by the live editor score (and any
// future server-side check). Returns check KEYS (UI maps them to i18n labels)
// and a 0–100 score. No hardcoded copy here.

export type SeoCheck = { key: string; pass: boolean };
export type SeoResult = { score: number; checks: SeoCheck[] };

export function analyzeSeo(input: {
  focusKeyword: string;
  title: string;
  description: string;
  slug: string;
  /** Plain-text body (HTML stripped) for content checks. Optional. */
  bodyText?: string;
}): SeoResult {
  const kw = input.focusKeyword.trim().toLowerCase();
  const title = input.title.trim();
  const desc = input.description.trim();
  const slug = input.slug.trim().toLowerCase();
  const body = (input.bodyText ?? "").trim();
  const kwSlug = kw.replace(/\s+/g, "-");
  const has = (s: string) => kw.length > 0 && s.toLowerCase().includes(kw);

  const checks: SeoCheck[] = [
    { key: "keywordSet", pass: kw.length > 0 },
    { key: "keywordInTitle", pass: has(title) },
    { key: "keywordInDescription", pass: has(desc) },
    { key: "keywordInSlug", pass: kw.length > 0 && slug.includes(kwSlug) },
    { key: "titleLength", pass: title.length >= 30 && title.length <= 60 },
    { key: "descriptionLength", pass: desc.length >= 120 && desc.length <= 160 },
  ];
  if (body.length > 0) {
    const first = body.slice(0, 200);
    checks.push({ key: "keywordInIntro", pass: has(first) });
    checks.push({ key: "contentLength", pass: body.split(/\s+/).length >= 300 });
  }

  const passed = checks.filter((c) => c.pass).length;
  const score = checks.length ? Math.round((passed / checks.length) * 100) : 0;
  return { score, checks };
}

/** Map a 0–100 score to a semantic token band (no hardcoded colors). */
export function seoScoreBand(score: number): "danger" | "warning" | "success" {
  if (score < 50) return "danger";
  if (score < 80) return "warning";
  return "success";
}
