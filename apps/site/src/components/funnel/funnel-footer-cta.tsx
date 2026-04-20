// Last-mile reassurance for applicants who still hesitate — "write to us"
// fallback. Only render when the Resend domain is verified (passed in by
// the page) so emails sent here actually get read.
export function FunnelFooterCta({
  text,
  email,
}: {
  text: string;
  email: string;
}) {
  return (
    <section className="bg-background py-10">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          {text}{" "}
          <a
            href={`mailto:${email}`}
            className="font-semibold text-primary hover:underline"
          >
            {email}
          </a>
          .
        </p>
      </div>
    </section>
  );
}
