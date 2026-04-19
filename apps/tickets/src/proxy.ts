import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@dbc/supabase";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@dbc/types";

/** Routes that require buyer authentication (magic link) */
const AUTH_REQUIRED_PATHS = ["/orders", "/transfer"];

// Map ISO-3166 country codes to the most appropriate UI locale. Applied as a
// fallback after explicit cookie/Accept-Language — so a user's saved choice
// always wins over geo.
const COUNTRY_LOCALE: Record<string, Locale> = {
  // French-speaking
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
  // German-speaking
  DE: "de",
  AT: "de",
  CH: "de",
  LI: "de",
};

function parseAcceptLanguage(header: string | null): Locale | null {
  if (!header) return null;
  // q-weighted list: "fr-FR,fr;q=0.9,en;q=0.8"
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Locale detection & redirect ---
  const pathnameHasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // Priority: user's saved choice > browser preference > geo > default.
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

  const segments = pathname.split("/");
  const locale = segments[1];
  const pathWithoutLocale = "/" + segments.slice(2).join("/");

  // --- Auth check (only for protected buyer routes) ---
  const requiresAuth = AUTH_REQUIRED_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/")
  );

  const { supabase, response } = createMiddlewareClient(request);

  if (requiresAuth) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Redirect to magic link auth page
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/auth`;
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  } else {
    // Still refresh session for logged-in users on public pages
    await supabase.auth.getUser();
  }

  response.cookies.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: [
    // Exclude Next.js App Router convention files that live at the root
    // (icon.png, apple-icon.png, opengraph-image.png, manifest.webmanifest,
    // robots.txt, sitemap.xml, favicon.ico) + the numbered icon-XXX variants
    // in /public, or middleware will 307-redirect them into /{locale}/…
    // which breaks browser icon resolution and the PWA manifest.
    "/((?!_next/static|_next/image|favicon.ico|icon\\.png|icon-.*|apple-icon\\.png|apple-touch-icon|opengraph-image|twitter-image|robots\\.txt|sitemap\\.xml|manifest|api/).*)",
  ],
};
