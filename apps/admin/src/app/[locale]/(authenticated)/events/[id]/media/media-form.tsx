"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AssetUpload, Button, FormField, Input, Select } from "@dbc/ui";
import { addEventMedia, uploadEventMediaFile } from "@/actions/media";

const MF_T = {
  en: {
    added: "Media added",
    uploadToast: "File uploaded — click Add media to save",
    typeLabel: "Type",
    photo: "Photo",
    video: "Video",
    link: "Link",
    titleLabel: "Title",
    titleHint: "Optional. Shown as the caption on the public event page.",
    titlePh: "e.g. Keynote photos",
    sort: "Sort order",
    uploadLabel: "Upload a file (optional)",
    uploadDesc:
      "Upload to Supabase Storage. Or skip and paste any public URL below.",
    urlLabel: "URL *",
    urlHint:
      "Required. Paste a URL from Supabase Storage, Google Drive, YouTube, Vimeo, or any public link.",
    adding: "Adding…",
    add: "Add media",
  },
  de: {
    added: "Medium hinzugefügt",
    uploadToast: "Datei hochgeladen — klicken Sie auf „Medium hinzufügen“ zum Speichern",
    typeLabel: "Typ",
    photo: "Foto",
    video: "Video",
    link: "Link",
    titleLabel: "Titel",
    titleHint: "Optional. Wird als Bildunterschrift auf der öffentlichen Event-Seite gezeigt.",
    titlePh: "z. B. Keynote-Fotos",
    sort: "Sortierung",
    uploadLabel: "Datei hochladen (optional)",
    uploadDesc:
      "Zu Supabase Storage hochladen. Oder überspringen und unten eine öffentliche URL einfügen.",
    urlLabel: "URL *",
    urlHint:
      "Erforderlich. URL aus Supabase Storage, Google Drive, YouTube, Vimeo oder jedem öffentlichen Link einfügen.",
    adding: "Wird hinzugefügt…",
    add: "Medium hinzufügen",
  },
  fr: {
    added: "Média ajouté",
    uploadToast: "Fichier téléversé — cliquez sur Ajouter pour enregistrer",
    typeLabel: "Type",
    photo: "Photo",
    video: "Vidéo",
    link: "Lien",
    titleLabel: "Titre",
    titleHint: "Optionnel. Affiché comme légende sur la page publique.",
    titlePh: "ex. Photos keynote",
    sort: "Ordre",
    uploadLabel: "Téléverser un fichier (optionnel)",
    uploadDesc:
      "Téléverser vers Supabase Storage. Ou ignorer et coller une URL publique ci-dessous.",
    urlLabel: "URL *",
    urlHint:
      "Obligatoire. Collez une URL depuis Supabase Storage, Google Drive, YouTube, Vimeo ou tout lien public.",
    adding: "Ajout…",
    add: "Ajouter un média",
  },
} as const;

type ActionResult = { error?: string; success?: boolean } | null;

export function MediaForm({
  eventId,
  locale,
}: {
  eventId: string;
  locale: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"photo" | "video" | "link">("photo");
  const t = MF_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof MF_T];

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev, formData) => {
      formData.set("event_id", eventId);
      formData.set("locale", locale);
      formData.set("url", url);
      formData.set("type", type);
      const result = await addEventMedia(formData);
      if ("success" in result && result.success) {
        setUrl("");
      }
      return result;
    },
    null
  );

  const lastHandledRef = useRef<ActionResult>(null);
  useEffect(() => {
    if (state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state?.error) {
      toast.error(state.error);
      return;
    }
    if (state?.success) {
      toast.success(t.added);
      router.refresh();
    }
  }, [state, router, t.added]);

  async function handleUpload(file: File): Promise<string> {
    const result = await uploadEventMediaFile(eventId, file);
    if ("error" in result && result.error) {
      throw new Error(result.error);
    }
    if ("url" in result && result.url) {
      setUrl(result.url);
      toast.success(t.uploadToast);
      return result.url;
    }
    throw new Error("Upload returned no URL.");
  }

  return (
    <form action={formAction} className="mt-4 space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <FormField label={t.typeLabel}>
          <Select
            value={type}
            onChange={(e) =>
              setType(e.target.value as "photo" | "video" | "link")
            }
          >
            <option value="photo">{t.photo}</option>
            <option value="video">{t.video}</option>
            <option value="link">{t.link}</option>
          </Select>
        </FormField>
        <div className="sm:col-span-2">
          <FormField label={t.titleLabel} hint={t.titleHint}>
            <Input name="title" placeholder={t.titlePh} />
          </FormField>
        </div>
        <FormField label={t.sort}>
          <Input name="sort_order" type="number" defaultValue="0" />
        </FormField>
      </div>

      {type !== "link" && (
        <AssetUpload
          label={t.uploadLabel}
          description={t.uploadDesc}
          accept={
            type === "video"
              ? "video/mp4,video/webm,video/quicktime"
              : "image/png,image/jpeg,image/webp,image/avif"
          }
          value={url || null}
          onUpload={handleUpload}
          onChange={setUrl}
          onRemove={() => setUrl("")}
        />
      )}

      <FormField label={t.urlLabel} required hint={t.urlHint}>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          type="url"
          required
          placeholder="https://…"
          className="font-mono"
        />
      </FormField>

      <Button type="submit" disabled={isPending || !url}>
        {isPending ? t.adding : t.add}
      </Button>
    </form>
  );
}
