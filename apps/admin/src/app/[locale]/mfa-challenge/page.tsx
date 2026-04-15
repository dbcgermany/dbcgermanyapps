import { MfaChallengeForm } from "./challenge-form";

export default async function MfaChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { locale } = await params;
  const { redirect } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 shadow-sm">
        <h1 className="font-heading text-2xl font-bold">Two-factor check</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the 6-digit code from your authenticator app, or one of your
          one-time backup codes.
        </p>
        <MfaChallengeForm locale={locale} redirectTo={redirect ?? undefined} />
      </div>
    </div>
  );
}
