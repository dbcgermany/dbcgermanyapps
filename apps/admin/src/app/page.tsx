import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "@dbc/types";

/** Root page — redirect to locale-prefixed dashboard */
export default function RootPage() {
  redirect(`/${DEFAULT_LOCALE}/dashboard`);
}
