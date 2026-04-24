// Single-line badge above the CTA. When the real 24 h purchase count
// is below the floor (TRIGGER_POLICY.SOCIAL_PROOF_FLOOR, currently 10),
// we render "<floor>+" — the trailing + is the honesty tell, it flags
// that the display is anchored rather than exact. Once real >= floor
// the + disappears and the real number shows.

function UsersIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-primary"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function SocialProofBadge({
  displayed,
  floored,
  label,
}: {
  displayed: number;
  floored: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
      <UsersIcon />
      <span className="leading-tight">
        <strong className="font-semibold">
          {displayed}
          {floored ? "+" : ""}
        </strong>{" "}
        {label}
      </span>
    </div>
  );
}
