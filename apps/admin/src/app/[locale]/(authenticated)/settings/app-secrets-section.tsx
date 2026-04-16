"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Key, Plus, Trash2 } from "lucide-react";
import type { AppSecret } from "@/actions/app-secrets";
import { upsertAppSecret } from "@/actions/app-secrets";

const KNOWN_KEYS: Array<{ key: string; note: string }> = [
  {
    key: "ANTHROPIC_API_KEY",
    note: "Used by the daily admin digest cron and other AI features.",
  },
  {
    key: "RESEND_API_KEY",
    note: "Transactional email provider. Falls back to env var if unset here.",
  },
  {
    key: "OPENAI_API_KEY",
    note: "Reserved for future OpenAI-backed features (image generation, etc).",
  },
];

export function AppSecretsSection({ secrets }: { secrets: AppSecret[] }) {
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);

  const byKey = new Map(secrets.map((s) => [s.key, s]));
  // Surface known keys even if unset, plus any DB keys we don't know about.
  const rows = [
    ...KNOWN_KEYS.map((known) => ({
      known: true as const,
      key: known.key,
      note: byKey.get(known.key)?.note ?? known.note,
      secret: byKey.get(known.key),
    })),
    ...secrets
      .filter((s) => !KNOWN_KEYS.some((k) => k.key === s.key))
      .map((s) => ({
        known: false as const,
        key: s.key,
        note: s.note ?? "",
        secret: s,
      })),
  ];

  function handleSave(key: string, value: string, note: string) {
    startTransition(async () => {
      const result = await upsertAppSecret(key, value, note);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(value ? "Secret saved." : "Secret deleted.");
      }
    });
  }

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div>
          <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
            <Key className="h-4 w-4 text-primary" strokeWidth={1.75} />
            API keys &amp; secrets
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Super-admin only. Values are stored in Supabase and read at
            runtime; Vercel env vars are the fallback.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((x) => !x)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
          {showAddForm ? "Cancel" : "Add custom key"}
        </button>
      </div>

      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li key={row.key}>
            <SecretRow
              canonicalKey={row.key}
              note={row.note}
              secret={row.secret}
              isPending={isPending}
              onSave={handleSave}
            />
          </li>
        ))}

        {showAddForm && (
          <li>
            <SecretRow
              canonicalKey=""
              note=""
              secret={undefined}
              isPending={isPending}
              allowKeyEdit
              onSave={(k, v, n) => {
                handleSave(k, v, n);
                setShowAddForm(false);
              }}
            />
          </li>
        )}
      </ul>
    </section>
  );
}

function SecretRow({
  canonicalKey,
  note,
  secret,
  isPending,
  allowKeyEdit = false,
  onSave,
}: {
  canonicalKey: string;
  note: string;
  secret: AppSecret | undefined;
  isPending: boolean;
  allowKeyEdit?: boolean;
  onSave: (key: string, value: string, note: string) => void;
}) {
  const [keyDraft, setKeyDraft] = useState(canonicalKey);
  const [valueDraft, setValueDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState(note);
  const [editing, setEditing] = useState(false);

  const hasValue = Boolean(secret?.has_value);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave(allowKeyEdit ? keyDraft : canonicalKey, valueDraft, noteDraft);
    setValueDraft("");
    setEditing(false);
  }

  function handleDelete() {
    if (!confirm(`Delete ${canonicalKey}?`)) return;
    onSave(canonicalKey, "", "");
  }

  return (
    <div className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {allowKeyEdit ? (
            <input
              type="text"
              value={keyDraft}
              onChange={(e) => setKeyDraft(e.target.value.toUpperCase())}
              placeholder="CUSTOM_KEY_NAME"
              className="w-full rounded-md border border-border bg-background px-3 py-1.5 font-mono text-sm"
            />
          ) : (
            <p className="font-mono text-sm font-semibold">{canonicalKey}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{note}</p>
          {secret && (
            <p className="mt-2 flex items-center gap-2 text-xs">
              <span
                className={
                  hasValue
                    ? "rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                }
              >
                {hasValue ? `Set \u2022 ${secret.value_masked}` : "Not set"}
              </span>
              <span className="text-muted-foreground">
                Updated {new Date(secret.updated_at).toLocaleDateString()}
              </span>
            </p>
          )}
          {!secret && !allowKeyEdit && (
            <p className="mt-2 text-xs">
              <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                Not set (falls back to env var if defined)
              </span>
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!editing ? (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                {hasValue ? "Rotate" : "Set"}
              </button>
              {hasValue && !allowKeyEdit && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1 rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                  aria-label={`Delete ${canonicalKey}`}
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Delete
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>

      {editing && (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            type="password"
            autoComplete="off"
            value={valueDraft}
            onChange={(e) => setValueDraft(e.target.value)}
            placeholder="Paste secret value"
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
          />
          <input
            type="text"
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            placeholder="Optional note (e.g. source, expiry)"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || !valueDraft.trim()}
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {isPending ? "Saving\u2026" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setValueDraft("");
              }}
              className="rounded-md border border-border px-4 py-1.5 text-sm hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
