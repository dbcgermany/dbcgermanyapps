import { type NextRequest, NextResponse } from "next/server";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@dbc/types";

const COUNTRY_LOCALE: Record<string, Locale> = {
  FR: "fr",
  BE: "fr",
  LU: "fr",
  MC: "fr",
  CI: "fr",
  SN: "fr",
  ML: "fr",
  BF: "fr",
  NE: "fr",
  TG: "fr",
  BJ: "fr",
  CM: "fr",
  GA: "fr",
  CG: "fr",
  CD: "fr",
  MG: "fr",
  DZ: "fr",
  MA: "fr",
  TN: "fr",
  DE: "de",
  AT: "de",
  CH: "de",
  LI: "de",
};

function parseAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  const entries = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.startsWith("q="));
      const q = qParam ? parseFloat(qParam.slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), q };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of entries) {
    const base = tag.split("-")[0];
    if ((LOCALES as readonly string[]).includes(base)) return base as Locale;
  }
  return null;
}

function geoLocale(request: NextRequest): Locale | null {
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    "";
  return country ? COUNTRY_LOCALE[country.toUpperCase()] ?? null : null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    const response = NextResponse.next();
    const locale = pathname.split("/")[1];
    response.cookies.set("locale", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return response;
  }

  const cookieLocale = request.cookies.get("locale")?.value;
  const chosen =
    (cookieLocale && (LOCALES as readonly string[]).includes(cookieLocale)
      ? (cookieLocale as Locale)
      : null) ??
    parseAcceptLanguage(request.headers.get("accept-language")) ??
    geoLocale(request) ??
    DEFAULT_LOCALE;

  const url = request.nextUrl.clone();
  url.pathname = `/${chosen}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Exclude Next.js App Router convention files (icon.png, apple-icon.png,
    // opengraph-image.png, manifest.webmanifest) + the numbered icon-XXX
    // variants in /public, or this middleware would 307-redirect them into
    // /{locale}/… and break browser icon resolution and the PWA manifest.
    "/((?!_next/static|_next/image|favicon.ico|icon\\.png|icon-.*|apple-icon\\.png|apple-touch-icon|opengraph-image|twitter-image|robots\\.txt|sitemap\\.xml|manifest|api/).*)",
  ],
};
