import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@dbc/supabase";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@dbc/types";

const PUBLIC_PATHS = ["/login", "/set-password", "/auth/callback"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Locale detection & redirect ---
  const pathnameHasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // Detect locale from cookie > Accept-Language header > default
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

  // Extract locale and path without locale prefix
  const segments = pathname.split("/");
  const locale = segments[1];
  const pathWithoutLocale = "/" + segments.slice(2).join("/");

  // --- Auth check (skip for public paths) ---
  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/")
  );

  const { supabase, response } = createMiddlewareClient(request);

  // Refresh session (important: must call getUser, not getSession, for security)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath) {
    // Not authenticated — redirect to login
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isPublicPath) {
    // Already authenticated — redirect to dashboard
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  // Set locale cookie for consistency
  response.cookies.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icons, images
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|icon-.*|apple-touch-icon|robots.txt|manifest|api/).*)",
  ],
};
