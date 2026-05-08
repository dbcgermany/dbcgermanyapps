"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Quote } from "lucide-react";
import { Button, Card, Input, Label, Textarea } from "@dbc/ui";
import { EmptyState } from "@/components/empty-state";
import {
  createSiteTestimonial,
  deleteSiteTestimonial,
  updateSiteTestimonial,
  type SiteTestimonial,
} from "@/actions/site-content";

export function SiteTestimonialsClient({
  locale,
  initial,
}: {
  locale: string;
  initial: SiteTestimonial[];
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
          ? await createSiteTestimonial(fd)
          : await updateSiteTestimonial(id!, fd);
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
      const res = await deleteSiteTestimonial(id, locale);
      if (res?.error) alert(res.error);
      else refresh();
    });
  }

  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Featured rows appear on the marketing site (homepage + events archive)
          and as the fallback on event pages with no event-specific testimonials.
        </p>
        {!showAdd && (
          <Button onClick={() => setShowAdd(true)}>Add testimonial</Button>
        )}
      </div>

      {showAdd && (
        <Card className="mb-4">
          <SiteTestimonialForm
            mode="add"
            onSubmit={(fd) => submit(fd, "add")}
            onCancel={() => setShowAdd(false)}
            pending={pending}
          />
        </Card>
      )}

      {initial.length === 0 ? (
        <EmptyState
          icon={Quote}
          message="No site testimonials yet. Add the first one to populate the marketing site and event-page fallback."
        />
      ) : (
        <ul className="space-y-3">
          {initial.map((t) => (
            <li
              key={t.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              {editingId === t.id ? (
                <SiteTestimonialForm
                  mode="edit"
                  initial={t}
                  onSubmit={(fd) => submit(fd, "edit", t.id)}
                  onCancel={() => setEditingId(null)}
                  pending={pending}
                />
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-heading text-base font-bold">
                        {t.author_name}
                      </p>
                      {t.is_featured && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                          Featured
                        </span>
                      )}
                      {t.source_label && (
                        <span className="text-xs text-muted-foreground">
                          via {t.source_label}
                        </span>
                      )}
                    </div>
                    {t.author_role_en && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t.author_role_en}
                      </p>
                    )}
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      &ldquo;{t.quote_en}&rdquo;
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

function SiteTestimonialForm({
  mode,
  initial,
  onSubmit,
  onCancel,
  pending,
}: {
  mode: "add" | "edit";
  initial?: SiteTestimonial;
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
          <Label htmlFor="video_url">Video URL (YouTube / Vimeo, optional)</Label>
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
              defaultChecked={initial?.is_featured ?? true}
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="source_url">Source URL</Label>
          <Input
            id="source_url"
            name="source_url"
            type="url"
            placeholder="https://..."
            defaultValue={initial?.source_url ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="source_label">Source label</Label>
          <Input
            id="source_label"
            name="source_label"
            placeholder="e.g. Agence Ecofin"
            defaultValue={initial?.source_label ?? ""}
          />
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
