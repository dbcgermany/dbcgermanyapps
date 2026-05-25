import { redirect } from "next/navigation";

// The Schedule page has been unified into the Run-sheet (Program) page.
// Public/internal toggle on each row replaces the two-page split.
// Kept as a redirect so any deep link / bookmark still works.
export default async function SchedulePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect(`/${locale}/events/${id}/runsheet`);
}
