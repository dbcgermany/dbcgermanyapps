// Browser/edge-safe entrypoint. Anything exported from here must be importable
// from Client Components and Edge Middleware. Server-only helpers (which depend
// on `next/headers`) live in `./server` — import them as `@dbc/supabase/server`.

export { createBrowserClient } from "./browser-client";
export { createMiddlewareClient } from "./middleware-client";
