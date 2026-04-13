// Server-only entrypoint. Importing from this file is safe inside Server
// Components, Server Actions, and Route Handlers, but NOT inside Client
// Components, Edge Middleware, or other browser/edge bundles — it pulls in
// `next/headers`, which is only available in the Node.js server runtime.

export { createServerClient } from "./server-client";
export { requireRole } from "./guards";
export {
  notifyAdmins,
  markNotificationRead,
  markAllNotificationsRead,
} from "./notifications";
export type { NotificationType } from "./notifications";
