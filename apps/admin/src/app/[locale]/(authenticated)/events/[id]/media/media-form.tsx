"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { AssetUpload, Button } from "@dbc/ui";
import { addEventMedia, uploadEventMediaFile } from "@/actions/media";

const MF_T = {
  en: {
    added: "Media added.",
    uploadToast: "File uploaded — click Add Media to save.",
    typeLabel: "Type",
    photo: "Photo", video: "Video", link: "Link",
    titleLabel: "Title (optional)", titlePh: "e.g., Keynote photos",
    sort: "Sort order",
    uploadLabel: "Upload a file (optional)",
    uploadDesc: "Upload to Supabase Storage. Or skip and paste any public URL below.",
    urlLabel: "URL",
    urlHint: "Paste a URL from Supabase Storage, Google Drive, YouTube, Vimeo, or any public link.",
    adding: "Adding…", add: "Add Media",
  },
  de: {
    added: "Medium hinzugefügt.",
    uploadToast: "Datei hochgeladen — klicken Sie auf „Medium hinzufügen“ zum Speichern.",
    typeLabel: "Typ",
    photo: "Foto", video: "Video", link: "Link",
    titleLabel: "Titel (optional)", titlePh: "z. B. Keynote-Fotos",
    sort: "Sortierung",
    uploadLabel: "Datei hochladen (optional)",
    uploadDesc: "Zu Supabase Storage hochladen. Oder überspringen und unten eine öffentliche URL einfügen.",
    urlLabel: "URL",
    urlHint: "URL aus Supabase Storage, Google Drive, YouTube, Vimeo oder jedem öffentlichen Link einfügen.",
    adding: "Wird hinzugefügt…", add: "Medium hinzufügen",
  },
  fr: {
    added: "Média ajouté.",
    uploadToast: "Fichier téléversé — cliquez sur Ajouter pour enregistrer.",
    typeLabel: "Type",
    photo: "Photo", video: "Vidéo", link: "Lien",
    titleLabel: "Titre (optionnel)", titlePh: "ex. Photos keynote",
    sort: "Ordre",
    uploadLabel: "Téléverser un fichier (optionnel)",
    uploadDesc: "Téléverser vers Supabase Storage. Ou ignorer et coller une URL publique ci-dessous.",
    urlLabel: "URL",
    urlHint: "Collez une URL depuis Supabase Storage, Google Drive, YouTube, Vimeo ou tout lien public.",
    adding: "Ajout…", add: "Ajouter un média",
  },
} as const;

export function MediaForm({
  eventId,
  locale,
}: {
  eventId: string;
  locale: string;
}) {
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"photo" | "video" | "link">("photo");
  const t = MF_T[(locale === "de" || locale === "fr" ? locale : "en") as keyof typeof MF_T];
  const [state, formAction, isPending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
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
    <form action={formAction} className="mt-4 space-y-4">
      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {t.added}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            {t.typeLabel}
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="photo">{t.photo}</option>
            <option value="video">{t.video}</option>
            <option value="link">{t.link}</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-muted-foreground mb-1">
            {t.titleLabel}
          </label>
          <input
            name="title"
            type="text"
            placeholder={t.titlePh}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            {t.sort}
          </label>
          <input
            name="sort_order"
            type="number"
            defaultValue="0"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
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

      <div>
        <label className="block text-xs text-muted-foreground mb-1">{t.urlLabel}</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          type="url"
          required
          placeholder="https://…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {t.urlHint}
        </p>
      </div>

      <Button type="submit"
        disabled={isPending || !url}>
        {isPending ? t.adding : t.add}
      </Button>
    </form>
  );
}
