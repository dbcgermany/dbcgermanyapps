"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AssetUpload } from "@dbc/ui";
import {
  createTeamMember,
  updateTeamMember,
  uploadTeamMemberPhoto,
  type TeamMember,
} from "@/actions/team";

type Mode = "create" | "edit";

type FormState = { error?: string; success?: boolean } | null;

interface StaffAccount {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
}

export function TeamMemberForm({
  locale,
  mode,
  initial,
  staffAccounts = [],
}: {
  locale: string;
  mode: Mode;
  initial?: TeamMember;
  staffAccounts?: StaffAccount[];
}) {
  const router = useRouter();

  const [photoUrl, setPhotoUrl] = useState(initial?.photo_url ?? "");

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      formData.set("locale", locale);
      // Ensure the uploader's latest URL wins over any stale defaultValue.
      formData.set("photo_url", photoUrl);
      if (mode === "create") return createTeamMember(formData);
      return updateTeamMember(initial!.id, formData);
    },
    null
  );

  async function handlePhotoUpload(file: File): Promise<string> {
    const result = await uploadTeamMemberPhoto(file, initial?.id ?? null);
    if ("error" in result && result.error) {
      throw new Error(result.error);
    }
    if ("url" in result && result.url) {
      setPhotoUrl(result.url);
      toast.success("Photo uploaded.");
      return result.url;
    }
    throw new Error("Upload returned no URL.");
  }

  useEffect(() => {
    if (state?.success && mode === "edit") {
      router.refresh();
    }
  }, [state, router, mode]);

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <form action={formAction} className="mt-8 max-w-3xl space-y-6">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}
      {state?.success && mode === "edit" && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          Saved.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" defaultValue={initial?.name ?? ""} required />
        <Field
          label="Email"
          name="email"
          type="email"
          defaultValue={initial?.email ?? ""}
        />
        <Field
          label="LinkedIn URL"
          name="linkedin_url"
          type="url"
          defaultValue={initial?.linkedin_url ?? ""}
        />
        <Field
          label="Sort order"
          name="sort_order"
          type="number"
          defaultValue={initial?.sort_order?.toString() ?? "100"}
        />
        <div>
          <label htmlFor="visibility" className="mb-1 block text-sm font-medium">
            Visibility
          </label>
          <select
            id="visibility"
            name="visibility"
            defaultValue={initial?.visibility ?? "internal"}
            className={inputClass}
          >
            <option value="public">Public (shown on dbc-germany.com/team)</option>
            <option value="internal">Internal (admin-only)</option>
            <option value="hidden">Hidden (archived)</option>
          </select>
        </div>
        <div>
          <label htmlFor="profile_id" className="mb-1 block text-sm font-medium">
            Linked staff account
          </label>
          <select
            id="profile_id"
            name="profile_id"
            defaultValue={initial?.profile_id ?? ""}
            className={inputClass}
          >
            <option value="">None (external / no login)</option>
            {staffAccounts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.displayName || s.email} ({s.role.replace("_", " ")})
              </option>
            ))}
            {/* Keep current link visible even if it's not in the available list */}
            {initial?.profile_id &&
              !staffAccounts.some((s) => s.id === initial.profile_id) && (
                <option value={initial.profile_id}>
                  Current linked account
                </option>
              )}
          </select>
          <span className="mt-1 block text-xs text-muted-foreground">
            Link to a staff member who has admin dashboard access.
          </span>
        </div>
        <div className="sm:col-span-2">
          <AssetUpload
            label="Photo"
            description="JPG / PNG / WebP up to 5 MB. Square crops look best."
            value={photoUrl || null}
            onUpload={handlePhotoUpload}
            onChange={setPhotoUrl}
            onRemove={() => setPhotoUrl("")}
          />
          <label className="mt-3 block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Or paste a CDN URL
            </span>
            <input
              type="url"
              name="photo_url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://…"
              className={`${inputClass} font-mono`}
            />
          </label>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Role (trilingual)
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Field
            label="EN"
            name="role_en"
            defaultValue={initial?.role_en ?? ""}
            required
          />
          <Field label="DE" name="role_de" defaultValue={initial?.role_de ?? ""} />
          <Field label="FR" name="role_fr" defaultValue={initial?.role_fr ?? ""} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Bio (trilingual)
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Field
            label="EN"
            name="bio_en"
            defaultValue={initial?.bio_en ?? ""}
            textarea
            rows={6}
          />
          <Field
            label="DE"
            name="bio_de"
            defaultValue={initial?.bio_de ?? ""}
            textarea
            rows={6}
          />
          <Field
            label="FR"
            name="bio_fr"
            defaultValue={initial?.bio_fr ?? ""}
            textarea
            rows={6}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Saving…" : mode === "create" ? "Create" : "Save"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type,
  required,
  textarea,
  rows,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
  hint?: string;
}) {
  const className =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring";
  return (
    <label htmlFor={name} className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          rows={rows ?? 4}
          required={required}
          className={className}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type ?? "text"}
          defaultValue={defaultValue}
          required={required}
          className={className}
        />
      )}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
