import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAuthorisedCronRequest } from "@dbc/supabase/server";
import { runAffiliateCooldownCron } from "@dbc/affiliate/server";

export async function GET(req: Request) {
  if (!isAuthorisedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const result = await runAffiliateCooldownCron(supabase);
  return NextResponse.json({ ok: true, ...result });
}
