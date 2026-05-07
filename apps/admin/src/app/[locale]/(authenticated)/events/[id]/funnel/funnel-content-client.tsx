"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Select, Textarea } from "@dbc/ui";
import {
  createFaq,
  createPillar,
  createTestimonial,
  deleteFaq,
  deletePillar,
  deleteTestimonial,
  updateEventFunnelCopy,
  updateFaq,
  updatePillar,
  updateTestimonial,
  type EventFaq,
  type EventFunnelCopy,
  type EventPillar,
  type EventTestimonial,
} from "@/actions/event-funnel-content";
import {
  getEventHeroVideoUploadUrl,
  uploadEventHeroOverlay,
} from "@/actions/events";
import { createBrowserClient } from "@dbc/supabase";

export function FunnelContentClient({
  eventId,
  locale,
  copy,
  pillars,
  testimonials,
  faqs,
}: {
  eventId: string;
  locale: string;
  copy: EventFunnelCopy;
  pillars: EventPillar[];
  testimonials: EventTestimonial[];
  faqs: EventFaq[];
}) {
  return (
    <div className="space-y-12">
      <CopySection eventId={eventId} locale={locale} initial={copy} />
      <PillarsSection
        eventId={eventId}
        locale={locale}
        initial={pillars}
      />
      <TestimonialsSection
        eventId={eventId}
        locale={locale}
        initial={testimonials}
      />
      <FaqsSection eventId={eventId} locale={locale} initial={faqs} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Copy section (video / tagline / intro / closing / scarcity threshold)
// ---------------------------------------------------------------------------

function CopySection({
  eventId,
  locale,
  initial,
}: {
  eventId: string;
  locale: string;
  initial: EventFunnelCopy;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <section>
      <SectionHeader
        title="Hero, intro & closing"
        description="The hero composition (video / image, overlay PNG, overlay text, darkening) and the trilingual copy that frame every funnel section."
      />
      <form
        className="space-y-8"
        action={(fd) => {
          fd.set("locale", locale);
          startTransition(async () => {
            setError(null);
            setSaved(false);
            const res = await updateEventFunnelCopy(eventId, fd);
            if (res?.error) setError(res.error);
            else {
              setSaved(true);
              router.refresh();
            }
          });
        }}
      >
        <HeroBannerFields eventId={eventId} initial={initial} />
        <Card>
          <div>
            <Label htmlFor="scarcity_threshold">Scarcity threshold</Label>
            <Input
              id="scarcity_threshold"
              name="scarcity_threshold"
              type="number"
              min="0"
              defaultValue={String(initial.scarcity_threshold)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Show &ldquo;Only X left&rdquo; on the sticky bar when remaining ≤ this. Set 0 to disable.
            </p>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Funnel tagline (above the info card, trilingual)
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <Input name="funnel_tagline_en" defaultValue={initial.funnel_tagline_en ?? ""} placeholder="EN" />
            <Input name="funnel_tagline_de" defaultValue={initial.funnel_tagline_de ?? ""} placeholder="DE" />
            <Input name="funnel_tagline_fr" defaultValue={initial.funnel_tagline_fr ?? ""} placeholder="FR" />
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Funnel intro (between speakers strip and pillars, trilingual)
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <Textarea name="funnel_intro_en" defaultValue={initial.funnel_intro_en ?? ""} rows={5} placeholder="EN" />
            <Textarea name="funnel_intro_de" defaultValue={initial.funnel_intro_de ?? ""} rows={5} placeholder="DE" />
            <Textarea name="funnel_intro_fr" defaultValue={initial.funnel_intro_fr ?? ""} rows={5} placeholder="FR" />
          </div>
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Closing pitch (above the final CTA, trilingual)
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <Textarea name="funnel_closing_en" defaultValue={initial.funnel_closing_en ?? ""} rows={4} placeholder="EN" />
            <Textarea name="funnel_closing_de" defaultValue={initial.funnel_closing_de ?? ""} rows={4} placeholder="DE" />
            <Textarea name="funnel_closing_fr" defaultValue={initial.funnel_closing_fr ?? ""} rows={4} placeholder="FR" />
          </div>
        </Card>

        {error && (
          <p className="rounded-md border border-danger-strong/40 bg-danger-soft px-4 py-3 text-sm text-danger-strong">
            {error}
          </p>
        )}
        {saved && !error && (
          <p className="rounded-md border border-success-strong/40 bg-success-soft px-4 py-3 text-sm text-success-strong">
            Saved.
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save funnel copy"}
        </Button>
      </form>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Hero banner subcomponent — uploaded video / external embed URL,
// centered PNG overlay, trilingual overlay text, darkening tint.
// ---------------------------------------------------------------------------

function HeroBannerFields({
  eventId,
  initial,
}: {
  eventId: string;
  initial: EventFunnelCopy;
}) {
  const [videoUrl, setVideoUrl] = useState<string>(initial.hero_video_url ?? "");
  const [overlayUrl, setOverlayUrl] = useState<string>(
    initial.hero_overlay_image_url ?? "",
  );
  const [strength, setStrength] = useState<number>(
    Number.isFinite(initial.hero_darkening_strength)
      ? initial.hero_darkening_strength
      : 50,
  );

  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Hero banner
      </p>

      {/* Video — upload OR paste a YouTube/Vimeo URL */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="hero_video_url">Hero video URL</Label>
          <Input
            id="hero_video_url"
            name="hero_video_url"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Paste a YouTube/Vimeo URL, OR upload an mp4 below — the public URL fills this field.
          </p>
        </div>
        <FileUploadField
          label="Upload video (MP4 / WebM)"
          description="Up to 100 MB. Plays muted + looping behind the overlays. Uploaded straight to Supabase Storage (bypasses the 4.5 MB Vercel function cap)."
          accept="video/mp4,video/webm,video/quicktime"
          maxSizeBytes={100 * 1024 * 1024}
          onUpload={async (file) => {
            const sig = await getEventHeroVideoUploadUrl({
              eventId,
              contentType: file.type,
              sizeBytes: file.size,
            });
            if (!sig.success) {
              throw new Error(sig.error ?? "Could not create upload URL");
            }
            const supabase = createBrowserClient();
            const { error } = await supabase.storage
              .from("event-covers")
              .uploadToSignedUrl(sig.path, sig.token, file, {
                contentType: file.type,
                upsert: false,
              });
            if (error) {
              throw new Error(`Upload failed: ${error.message}`);
            }
            return sig.publicUrl;
          }}
          currentUrl={videoUrl || null}
          onResolved={(url) => setVideoUrl(url)}
        />
      </div>

      {/* Overlay PNG */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="hero_overlay_image_url">Centered PNG overlay URL</Label>
          <Input
            id="hero_overlay_image_url"
            name="hero_overlay_image_url"
            type="url"
            value={overlayUrl}
            onChange={(e) => setOverlayUrl(e.target.value)}
            placeholder="https://… (filled by upload)"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Sits centered over the background. Use a transparent PNG (logo, lockup, badge).
          </p>
        </div>
        <FileUploadField
          label="Upload PNG"
          description="Transparent PNG, up to 5 MB."
          accept="image/png"
          maxSizeBytes={5 * 1024 * 1024}
          onUpload={async (file) => {
            const fd = new FormData();
            fd.set("file", file);
            fd.set("event_id", eventId);
            const res = await uploadEventHeroOverlay(fd);
            if (res.success) return res.url;
            throw new Error(res.error ?? "Upload failed");
          }}
          currentUrl={overlayUrl || null}
          onResolved={(url) => setOverlayUrl(url)}
        />
      </div>

      {/* Trilingual overlay text */}
      <div className="mt-6">
        <p className="text-xs font-medium text-foreground">
          Overlay text (trilingual, optional — sits under the PNG)
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Input
            name="hero_overlay_text_en"
            defaultValue={initial.hero_overlay_text_en ?? ""}
            placeholder="EN"
          />
          <Input
            name="hero_overlay_text_de"
            defaultValue={initial.hero_overlay_text_de ?? ""}
            placeholder="DE"
          />
          <Input
            name="hero_overlay_text_fr"
            defaultValue={initial.hero_overlay_text_fr ?? ""}
            placeholder="FR"
          />
        </div>
      </div>

      {/* Darkening slider */}
      <div className="mt-6">
        <Label htmlFor="hero_darkening_strength">
          Darkening tint{" "}
          <span className="font-mono text-xs text-muted-foreground">
            {strength}%
          </span>
        </Label>
        <input
          id="hero_darkening_strength"
          name="hero_darkening_strength"
          type="range"
          min={0}
          max={100}
          value={strength}
          onChange={(e) => setStrength(parseInt(e.target.value, 10) || 0)}
          className="mt-2 w-full"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          0 = no tint · 50 = balanced (default) · 100 = nearly black. Boost when the background is busy.
        </p>
      </div>
    </Card>
  );
}

function FileUploadField({
  label,
  description,
  accept,
  maxSizeBytes,
  onUpload,
  currentUrl,
  onResolved,
}: {
  label: string;
  description: string;
  accept: string;
  maxSizeBytes: number;
  onUpload: (file: File) => Promise<string>;
  currentUrl: string | null;
  onResolved: (url: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > maxSizeBytes) {
      setError(
        `File is too large (max ${Math.round(maxSizeBytes / 1024 / 1024)} MB).`,
      );
      e.target.value = "";
      return;
    }
    startTransition(async () => {
      try {
        const url = await onUpload(file);
        onResolved(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        e.target.value = "";
      }
    });
  }

  return (
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        disabled={pending}
        className="mt-2 block w-full text-xs file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
      />
      {pending && (
        <p className="mt-1 text-xs text-muted-foreground">Uploading…</p>
      )}
      {error && (
        <p className="mt-1 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
      {currentUrl && !pending && (
        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          Current: {currentUrl}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pillars section
// ---------------------------------------------------------------------------

const ICON_OPTIONS = [
  "award",
  "briefcase",
  "graduation-cap",
  "handshake",
  "lightbulb",
  "mic",
  "network",
  "rocket",
  "sparkles",
  "star",
  "target",
  "trending-up",
  "trophy",
  "users",
];

function PillarsSection({
  eventId,
  locale,
  initial,
}: {
  eventId: string;
  locale: string;
  initial: EventPillar[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function submit(fd: FormData, mode: "add" | "edit", id?: string) {
    fd.set("locale", locale);
    startTransition(async () => {
      const res =
        mode === "add"
          ? await createPillar(eventId, fd)
          : await updatePillar(id!, fd);
      if (res?.error) alert(res.error);
      else {
        setShowAdd(false);
        setEditingId(null);
        refresh();
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this pillar?")) return;
    startTransition(async () => {
      const res = await deletePillar(id, eventId, locale);
      if (res?.error) alert(res.error);
      else {
        setItems(items.filter((x) => x.id !== id));
        refresh();
      }
    });
  }

  return (
    <section>
      <SectionHeader
        title="Pillars — “What you take home”"
        description="3–6 benefit cards shown below the speakers strip."
        action={
          !showAdd ? (
            <Button onClick={() => setShowAdd(true)}>Add pillar</Button>
          ) : null
        }
      />

      {showAdd && (
        <Card className="mb-4">
          <PillarForm
            mode="add"
            onSubmit={(fd) => submit(fd, "add")}
            onCancel={() => setShowAdd(false)}
            pending={pending}
          />
        </Card>
      )}

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No pillars yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => (
            <li
              key={p.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              {editingId === p.id ? (
                <PillarForm
                  mode="edit"
                  initial={p}
                  onSubmit={(fd) => submit(fd, "edit", p.id)}
                  onCancel={() => setEditingId(null)}
                  pending={pending}
                />
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-heading text-base font-bold">
                      {p.title_en}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      icon: {p.icon ?? "—"} · sort: {p.sort_order}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setEditingId(p.id)}>
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => remove(p.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PillarForm({
  mode,
  initial,
  onSubmit,
  onCancel,
  pending,
}: {
  mode: "add" | "edit";
  initial?: EventPillar;
  onSubmit: (fd: FormData) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  return (
    <form
      className="space-y-4"
      action={(fd) => onSubmit(fd)}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="icon">Icon</Label>
          <Select id="icon" name="icon" defaultValue={initial?.icon ?? ""}>
            <option value="">— none —</option>
            {ICON_OPTIONS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="sort_order">Sort order</Label>
          <Input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue={initial?.sort_order ?? 100}
          />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Title (trilingual)
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Input name="title_en" defaultValue={initial?.title_en ?? ""} placeholder="EN" required />
          <Input name="title_de" defaultValue={initial?.title_de ?? ""} placeholder="DE" />
          <Input name="title_fr" defaultValue={initial?.title_fr ?? ""} placeholder="FR" />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Description (trilingual)
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Textarea name="description_en" defaultValue={initial?.description_en ?? ""} placeholder="EN" rows={3} />
          <Textarea name="description_de" defaultValue={initial?.description_de ?? ""} placeholder="DE" rows={3} />
          <Textarea name="description_fr" defaultValue={initial?.description_fr ?? ""} placeholder="FR" rows={3} />
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {mode === "add" ? "Add pillar" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Testimonials section
// ---------------------------------------------------------------------------

function TestimonialsSection({
  eventId,
  locale,
  initial,
}: {
  eventId: string;
  locale: string;
  initial: EventTestimonial[];
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function submit(fd: FormData, mode: "add" | "edit", id?: string) {
    fd.set("locale", locale);
    startTransition(async () => {
      const res =
        mode === "add"
          ? await createTestimonial(eventId, fd)
          : await updateTestimonial(id!, fd);
      if (res?.error) alert(res.error);
      else {
        setShowAdd(false);
        setEditingId(null);
        refresh();
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    startTransition(async () => {
      const res = await deleteTestimonial(id, eventId, locale);
      if (res?.error) alert(res.error);
      else refresh();
    });
  }

  return (
    <section>
      <SectionHeader
        title="Testimonials"
        description="Quotes from past attendees. Optional video URL turns the photo into a play-overlay."
        action={
          !showAdd ? (
            <Button onClick={() => setShowAdd(true)}>Add testimonial</Button>
          ) : null
        }
      />

      {showAdd && (
        <Card className="mb-4">
          <TestimonialForm
            mode="add"
            onSubmit={(fd) => submit(fd, "add")}
            onCancel={() => setShowAdd(false)}
            pending={pending}
          />
        </Card>
      )}

      {initial.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No testimonials yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {initial.map((t) => (
            <li
              key={t.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              {editingId === t.id ? (
                <TestimonialForm
                  mode="edit"
                  initial={t}
                  onSubmit={(fd) => submit(fd, "edit", t.id)}
                  onCancel={() => setEditingId(null)}
                  pending={pending}
                />
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-heading text-base font-bold">
                      {t.author_name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {t.quote_en}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="ghost" onClick={() => setEditingId(t.id)}>
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => remove(t.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TestimonialForm({
  mode,
  initial,
  onSubmit,
  onCancel,
  pending,
}: {
  mode: "add" | "edit";
  initial?: EventTestimonial;
  onSubmit: (fd: FormData) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  return (
    <form className="space-y-4" action={(fd) => onSubmit(fd)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="author_name">Author name</Label>
          <Input
            id="author_name"
            name="author_name"
            required
            defaultValue={initial?.author_name ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="author_photo_url">Author photo URL</Label>
          <Input
            id="author_photo_url"
            name="author_photo_url"
            type="url"
            defaultValue={initial?.author_photo_url ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="video_url">Video URL (YouTube / Vimeo)</Label>
          <Input
            id="video_url"
            name="video_url"
            type="url"
            defaultValue={initial?.video_url ?? ""}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="rating">Rating (1–5, optional)</Label>
            <Input
              id="rating"
              name="rating"
              type="number"
              min="1"
              max="5"
              defaultValue={initial?.rating ?? ""}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="sort_order">Sort order</Label>
            <Input
              id="sort_order"
              name="sort_order"
              type="number"
              defaultValue={initial?.sort_order ?? 100}
            />
          </div>
          <label className="flex items-center gap-2 pb-2 pt-7 text-sm">
            <input
              type="checkbox"
              name="is_featured"
              defaultChecked={initial?.is_featured}
              className="h-4 w-4 rounded border-border"
            />
            Featured
          </label>
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Author role (trilingual)
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Input name="author_role_en" defaultValue={initial?.author_role_en ?? ""} placeholder="EN" />
          <Input name="author_role_de" defaultValue={initial?.author_role_de ?? ""} placeholder="DE" />
          <Input name="author_role_fr" defaultValue={initial?.author_role_fr ?? ""} placeholder="FR" />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quote (trilingual)
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Textarea name="quote_en" defaultValue={initial?.quote_en ?? ""} placeholder="EN" rows={4} required />
          <Textarea name="quote_de" defaultValue={initial?.quote_de ?? ""} placeholder="DE" rows={4} />
          <Textarea name="quote_fr" defaultValue={initial?.quote_fr ?? ""} placeholder="FR" rows={4} />
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {mode === "add" ? "Add testimonial" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// FAQs section
// ---------------------------------------------------------------------------

function FaqsSection({
  eventId,
  locale,
  initial,
}: {
  eventId: string;
  locale: string;
  initial: EventFaq[];
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function submit(fd: FormData, mode: "add" | "edit", id?: string) {
    fd.set("locale", locale);
    startTransition(async () => {
      const res =
        mode === "add"
          ? await createFaq(eventId, fd)
          : await updateFaq(id!, fd);
      if (res?.error) alert(res.error);
      else {
        setShowAdd(false);
        setEditingId(null);
        refresh();
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    startTransition(async () => {
      const res = await deleteFaq(id, eventId, locale);
      if (res?.error) alert(res.error);
      else refresh();
    });
  }

  return (
    <section>
      <SectionHeader
        title="FAQs"
        description="Objection-handling Q&A shown above the closing pitch."
        action={
          !showAdd ? (
            <Button onClick={() => setShowAdd(true)}>Add FAQ</Button>
          ) : null
        }
      />

      {showAdd && (
        <Card className="mb-4">
          <FaqForm
            mode="add"
            onSubmit={(fd) => submit(fd, "add")}
            onCancel={() => setShowAdd(false)}
            pending={pending}
          />
        </Card>
      )}

      {initial.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No FAQs yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {initial.map((q) => (
            <li
              key={q.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              {editingId === q.id ? (
                <FaqForm
                  mode="edit"
                  initial={q}
                  onSubmit={(fd) => submit(fd, "edit", q.id)}
                  onCancel={() => setEditingId(null)}
                  pending={pending}
                />
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-heading text-base font-bold">
                      {q.question_en}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {q.answer_en}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="ghost" onClick={() => setEditingId(q.id)}>
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => remove(q.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FaqForm({
  mode,
  initial,
  onSubmit,
  onCancel,
  pending,
}: {
  mode: "add" | "edit";
  initial?: EventFaq;
  onSubmit: (fd: FormData) => void;
  onCancel: () => void;
  pending: boolean;
}) {
  return (
    <form className="space-y-4" action={(fd) => onSubmit(fd)}>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <Label htmlFor="sort_order">Sort order</Label>
          <Input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue={initial?.sort_order ?? 100}
          />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Question (trilingual)
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Input name="question_en" defaultValue={initial?.question_en ?? ""} placeholder="EN" required />
          <Input name="question_de" defaultValue={initial?.question_de ?? ""} placeholder="DE" />
          <Input name="question_fr" defaultValue={initial?.question_fr ?? ""} placeholder="FR" />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Answer (trilingual)
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <Textarea name="answer_en" defaultValue={initial?.answer_en ?? ""} placeholder="EN" rows={5} required />
          <Textarea name="answer_de" defaultValue={initial?.answer_de ?? ""} placeholder="DE" rows={5} />
          <Textarea name="answer_fr" defaultValue={initial?.answer_fr ?? ""} placeholder="FR" rows={5} />
        </div>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {mode === "add" ? "Add FAQ" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-heading text-xl font-bold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
