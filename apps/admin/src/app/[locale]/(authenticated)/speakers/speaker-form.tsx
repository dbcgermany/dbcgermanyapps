"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AssetUpload,
  Button,
  Card,
  Input,
  Label,
  Select,
  Textarea,
} from "@dbc/ui";
import {
  createSpeaker,
  deleteSpeaker,
  updateSpeaker,
  uploadSpeakerPhoto,
  type Speaker,
} from "@/actions/speakers";

type Mode = "create" | "edit";

type FormState = { error?: string; success?: boolean } | null;

async function createAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return (await createSpeaker(formData)) ?? null;
}

function makeUpdateAction(id: string) {
  return async function updateAction(
    _prev: FormState,
    formData: FormData,
  ): Promise<FormState> {
    return (await updateSpeaker(id, formData)) ?? null;
  };
}

export function SpeakerForm({
  mode,
  locale,
  speaker,
  teamMembers,
}: {
  mode: Mode;
  locale: string;
  speaker?: Speaker;
  teamMembers: { id: string; name: string; slug: string }[];
}) {
  const router = useRouter();
  const action = mode === "create" ? createAction : makeUpdateAction(speaker!.id);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    null,
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    speaker?.photo_url ?? null,
  );
  const [deletingPending, startDelete] = useTransition();

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="locale" value={locale} />

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldText label="First name" name="first_name" required defaultValue={speaker?.first_name ?? ""} />
          <FieldText label="Last name" name="last_name" required defaultValue={speaker?.last_name ?? ""} />
          <FieldText label="URL slug" name="slug" defaultValue={speaker?.slug ?? ""} hint="Auto-generated from name if blank." />
          <FieldVisibility defaultValue={speaker?.visibility ?? "public"} />
          <FieldTeamMember
            teamMembers={teamMembers}
            defaultValue={speaker?.team_member_id ?? ""}
          />
        </div>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Photo
        </p>
        <div className="mt-3">
          <AssetUpload
            value={photoUrl}
            onUpload={async (file) => {
              const res = await uploadSpeakerPhoto(file, speaker?.id ?? null);
              if ("error" in res) throw new Error(res.error);
              setPhotoUrl(res.url);
              return res.url;
            }}
            onRemove={() => setPhotoUrl(null)}
          />
          <Input
            type="hidden"
            name="photo_url"
            value={photoUrl ?? ""}
            readOnly
          />
        </div>
      </Card>

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Title (trilingual)
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <FieldText label="EN" name="title_en" defaultValue={speaker?.title_en ?? ""} />
          <FieldText label="DE" name="title_de" defaultValue={speaker?.title_de ?? ""} />
          <FieldText label="FR" name="title_fr" defaultValue={speaker?.title_fr ?? ""} />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Company (trilingual)
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <FieldText label="EN" name="company_en" defaultValue={speaker?.company_en ?? ""} />
          <FieldText label="DE" name="company_de" defaultValue={speaker?.company_de ?? ""} />
          <FieldText label="FR" name="company_fr" defaultValue={speaker?.company_fr ?? ""} />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Bio (trilingual, markdown OK)
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <FieldTextarea label="EN" name="bio_en" defaultValue={speaker?.bio_en ?? ""} />
          <FieldTextarea label="DE" name="bio_de" defaultValue={speaker?.bio_de ?? ""} />
          <FieldTextarea label="FR" name="bio_fr" defaultValue={speaker?.bio_fr ?? ""} />
        </div>
      </Card>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldText label="Email" name="email" type="email" defaultValue={speaker?.email ?? ""} />
          <FieldText label="LinkedIn URL" name="linkedin_url" type="url" defaultValue={speaker?.linkedin_url ?? ""} />
          <FieldText label="Twitter URL" name="twitter_url" type="url" defaultValue={speaker?.twitter_url ?? ""} />
          <FieldText label="Website URL" name="website_url" type="url" defaultValue={speaker?.website_url ?? ""} />
        </div>
      </Card>

      {state?.error && (
        <p className="rounded-md border border-danger-strong/40 bg-danger-soft px-4 py-3 text-sm text-danger-strong">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create speaker" : "Save changes"}
        </Button>
        {mode === "edit" && speaker && (
          <Button
            type="button"
            variant="destructive"
            disabled={deletingPending}
            onClick={() => {
              if (!confirm("Delete this speaker permanently?")) return;
              startDelete(async () => {
                await deleteSpeaker(speaker.id, locale);
                router.push(`/${locale}/speakers`);
              });
            }}
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}

function FieldText({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
      />
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FieldTextarea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} defaultValue={defaultValue} rows={6} />
    </div>
  );
}

function FieldVisibility({ defaultValue }: { defaultValue: string }) {
  return (
    <div>
      <Label htmlFor="visibility">Visibility</Label>
      <Select id="visibility" name="visibility" defaultValue={defaultValue}>
        <option value="public">Public — visible on event funnel</option>
        <option value="internal">Internal — admin-only preview</option>
        <option value="hidden">Hidden — archived</option>
      </Select>
    </div>
  );
}

function FieldTeamMember({
  teamMembers,
  defaultValue,
}: {
  teamMembers: { id: string; name: string; slug: string }[];
  defaultValue: string;
}) {
  return (
    <div>
      <Label htmlFor="team_member_id">Linked team member (optional)</Label>
      <Select id="team_member_id" name="team_member_id" defaultValue={defaultValue}>
        <option value="">— none —</option>
        {teamMembers.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </Select>
      <p className="mt-1 text-xs text-muted-foreground">
        If this speaker is also on the team, link them so updates propagate.
      </p>
    </div>
  );
}
