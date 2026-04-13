import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@dbc/supabase";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@dbc/types";

/** Routes that require buyer authentication (magic link) */
const AUTH_REQUIRED_PATHS = ["/orders", "/transfer"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Locale detection & redirect ---
  const pathnameHasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    const cookieLocale = request.cookies.get("locale")?.value;
    const headerLocale = request.headers
      .get("accept-language")
      ?.split(",")[0]
      ?.split("-")[0];
    const locale =
      (cookieLocale && LOCALES.includes(cookieLocale as Locale) ? cookieLocale : null) ??
      (headerLocale && LOCALES.includes(headerLocale as Locale) ? headerLocale : null) ??
      DEFAULT_LOCALE;

    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname}`;
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
    "/((?!_next/static|_next/image|favicon.ico|icon-.*|apple-touch-icon|robots.txt|manifest|api/).*)",
  ],
};
