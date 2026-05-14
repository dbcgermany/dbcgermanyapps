import { NextResponse } from "next/server";
import {
  submitChapterDelegateRegistration,
  type ChapterDelegateInput,
} from "@/actions/chapter-delegate";

// Plain JSON API route — used instead of calling the server action directly
// from the form. Server actions encode an opaque action ID into the client
// bundle that must match the server's encryption key; under Vercel's
// rolling-deploy strategy a tab opened against build N can hit build N+1
// on submit and the action ID mismatch surfaces as
// "Server Components render" errors that the user can only recover from
// with a hard reload. A regular HTTP POST has no such coupling — the body
// is plain JSON, the route stays addressable across deploys.
//
// We delegate to the same submitChapterDelegateRegistration server action
// so all validation + insert + notification logic stays one SSOT.
export async function POST(request: Request) {
  let input: ChapterDelegateInput;
  try {
    input = (await request.json()) as ChapterDelegateInput;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }
  const result = await submitChapterDelegateRegistration(input);
  return NextResponse.json(result, { status: 200 });
}
