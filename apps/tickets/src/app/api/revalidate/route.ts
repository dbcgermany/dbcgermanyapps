import { revalidateTag, revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// Secret-protected on-demand revalidation. Admin calls this after
// event / tier / coupon saves so the tickets app reflects changes
// immediately instead of waiting for the 30s ISR window.
//
// POST /api/revalidate
//   body: { tag?: string, path?: string, secret: string }
export async function POST(request: Request) {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "Revalidate endpoint not configured." },
      { status: 503 }
    );
  }

  let body: { tag?: string; path?: string; secret?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.secret !== expected) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (body.tag) revalidateTag(body.tag, "layout");
  if (body.path) revalidatePath(body.path, "layout");
  if (!body.tag && !body.path) {
    return NextResponse.json(
      { error: "Provide tag or path to revalidate." },
      { status: 400 }
    );
  }

  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}
