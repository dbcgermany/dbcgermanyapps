"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Label, Select } from "@dbc/ui";
import {
  attachSpeakerToEvent,
  detachSpeakerFromEvent,
  updateEventSpeaker,
  type EventSpeakerRow,
} from "@/actions/speakers";

export function EventSpeakersClient({
  eventId,
  locale,
  attached,
  available,
}: {
  eventId: string;
  locale: string;
  attached: EventSpeakerRow[];
  available: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  function handleSubmit(formData: FormData, mode: "add" | "edit", speakerId?: string) {
    startTransition(async () => {
      formData.set("locale", locale);
      const res =
        mode === "add"
          ? await attachSpeakerToEvent(eventId, formData)
          : await updateEventSpeaker(eventId, speakerId!, formData);
      if (res?.error) alert(res.error);
      else {
        setShowAdd(false);
        setEditingId(null);
        refresh();
      }
    });
  }

  function handleDetach(speakerId: string) {
    if (!confirm("Remove this speaker from the event?")) return;
    startTransition(async () => {
      const res = await detachSpeakerFromEvent(eventId, speakerId, locale);
      if (res?.error) alert(res.error);
      else refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {attached.length} attached · {available.length} more in library
        </p>
        {!showAdd && available.length > 0 && (
          <Button onClick={() => setShowAdd(true)}>Add speaker</Button>
        )}
      </div>

      {showAdd && (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Add a speaker to this event
          </p>
          <form
            className="mt-3 grid gap-4 sm:grid-cols-2"
            action={(fd) => handleSubmit(fd, "add")}
          >
            <div className="sm:col-span-2">
              <Label htmlFor="speaker_id">Speaker</Label>
              <Select id="speaker_id" name="speaker_id" required defaultValue="">
                <option value="" disabled>
                  — pick a speaker —
                </option>
                {available.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
            <RoleLabelFields />
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label htmlFor="sort_order">Sort order</Label>
                <Input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  defaultValue={(attached.length + 1) * 10}
                />
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input type="checkbox" name="is_featured" className="h-4 w-4 rounded border-border" />
                Featured (above-fold)
              </label>
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Add to event"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {attached.length === 0 && !showAdd ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No speakers on this event yet. Add the first one above.
        </p>
      ) : (
        <ul className="space-y-3">
          {attached.map((es) => (
            <li
              key={es.speaker_id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              {editingId === es.speaker_id ? (
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  action={(fd) => handleSubmit(fd, "edit", es.speaker_id)}
                >
                  <div className="sm:col-span-2 flex items-center gap-3">
                    {es.speakers.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={es.speakers.photo_url}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10" aria-hidden />
                    )}
                    <p className="font-heading text-base font-bold">
                      {es.speakers.first_name} {es.speakers.last_name}
                    </p>
                  </div>
                  <RoleLabelFields
                    en={es.role_label_en}
                    de={es.role_label_de}
                    fr={es.role_label_fr}
                  />
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Label htmlFor={`sort_${es.speaker_id}`}>Sort order</Label>
                      <Input
                        id={`sort_${es.speaker_id}`}
                        name="sort_order"
                        type="number"
                        defaultValue={es.sort_order}
                      />
                    </div>
                    <label className="flex items-center gap-2 pb-2 text-sm">
                      <input
                        type="checkbox"
                        name="is_featured"
                        defaultChecked={es.is_featured}
                        className="h-4 w-4 rounded border-border"
                      />
                      Featured
                    </label>
                  </div>
                  <div className="sm:col-span-2 flex gap-3">
                    <Button type="submit" disabled={pending}>
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {es.speakers.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={es.speakers.photo_url}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10" aria-hidden />
                    )}
                    <div className="min-w-0">
                      <p className="font-heading text-base font-bold">
                        {es.speakers.first_name} {es.speakers.last_name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {es.role_label_en ?? "—"}{" "}
                        {es.is_featured && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                            Featured
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => setEditingId(es.speaker_id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDetach(es.speaker_id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RoleLabelFields({
  en,
  de,
  fr,
}: {
  en?: string | null;
  de?: string | null;
  fr?: string | null;
}) {
  return (
    <div className="sm:col-span-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Role label (per-event, e.g. &ldquo;Keynote&rdquo;, &ldquo;Moderator &amp; Host&rdquo;)
      </p>
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="role_label_en">EN</Label>
          <Input id="role_label_en" name="role_label_en" defaultValue={en ?? ""} />
        </div>
        <div>
          <Label htmlFor="role_label_de">DE</Label>
          <Input id="role_label_de" name="role_label_de" defaultValue={de ?? ""} />
        </div>
        <div>
          <Label htmlFor="role_label_fr">FR</Label>
          <Input id="role_label_fr" name="role_label_fr" defaultValue={fr ?? ""} />
        </div>
      </div>
    </div>
  );
}
