import type { ReactNode } from "react";

/**
 * Read-only label + value row. Use inside ProfileSection for definition-
 * list style rows like "Email", "Joined on", "Email status". For
 * editable fields use FormField from @dbc/ui.
 */
export function ProfileField({
  label,
  value,
  hint,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 py-1">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">
        {value ?? <span className="text-muted-foreground">—</span>}
      </dd>
      {hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
