"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button, Input, Label } from "@dbc/ui";
import { createBrowserClient } from "@dbc/supabase";
import {
  getHomeHeroVideoUploadUrl,
  uploadHomeHeroOverlay,
  updateCompanyInfoSection,
  type CompanyInfo,
} from "@/actions/company-info";

// Dedicated form for the homepage-hero section. Mirrors the per-event
// HeroBannerFields admin block (apps/admin/.../events/[id]/funnel/funnel-
// content-client.tsx) but writes to company_info row id=1 via the same
// generic updateCompanyInfoSection("home_hero", fd) entry point.
//
// Video uploads use a Supabase signed upload URL so the browser streams
// straight to brand-assets/, bypassing the Vercel 4.5 MB serverless
// payload cap. PNG overlay (small) goes through the standard server
// action path.

export function HomeHeroForm({ info }: { info: CompanyInfo }) {
  const [pending, startTransition] = useTransition();
  const tCommon = useTranslations("admin.common");
  const [videoUrl, setVideoUrl] = useState<string>(
    info.home_hero_video_url ?? ""
  );
  const [imageUrl, setImageUrl] = useState<string>(
    info.home_hero_image_url ?? ""
  );
  const [overlayUrl, setOverlayUrl] = useState<string>(
    info.home_hero_overlay_image_url ?? ""
  );
  const [strength, setStrength] = useState<number>(
    Number.isFinite(info.home_hero_darkening_strength)
      ? info.home_hero_darkening_strength
      : 50
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateCompanyInfoSection("home_hero", formData);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(tCommon("savedToast"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input
        type="hidden"
        name="expected_updated_at"
        value={info.updated_at ?? ""}
      />

      {/* Video — paste a YouTube/Vimeo URL OR upload an mp4 */}
      <div className="rounded-md border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Background video
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="home_hero_video_url">Video URL</Label>
            <Input
              id="home_hero_video_url"
              name="home_hero_video_url"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=… or empty"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Paste a YouTube/Vimeo URL OR upload an mp4 → the public URL fills this field. Leave blank to fall back to the image below.
            </p>
          </div>
          <FileUploadField
            label="Upload video (MP4 / WebM)"
            description="Up to 100 MB. Plays muted + looping behind the overlays. Uploaded straight to Supabase Storage (bypasses the 4.5 MB Vercel function cap)."
            accept="video/mp4,video/webm,video/quicktime"
            maxSizeBytes={100 * 1024 * 1024}
            onUpload={async (file) => {
              const sig = await getHomeHeroVideoUploadUrl({
                contentType: file.type,
                sizeBytes: file.size,
              });
              if (!sig.success) {
                throw new Error(sig.error ?? "Could not create upload URL");
              }
              const supabase = createBrowserClient();
              const { error } = await supabase.storage
                .from("brand-assets")
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
      </div>

      {/* Fallback image — used when video is empty */}
      <div className="rounded-md border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Fallback image
        </p>
        <Label htmlFor="home_hero_image_url" className="mt-3 block">
          Image URL
        </Label>
        <Input
          id="home_hero_image_url"
          name="home_hero_image_url"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Used when no video is set. Leave blank to fall back to the hardcoded site default.
        </p>
      </div>

      {/* Centered PNG overlay */}
      <div className="rounded-md border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Centered PNG overlay
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="home_hero_overlay_image_url">Overlay URL</Label>
            <Input
              id="home_hero_overlay_image_url"
              name="home_hero_overlay_image_url"
              type="url"
              value={overlayUrl}
              onChange={(e) => setOverlayUrl(e.target.value)}
              placeholder="https://… (filled by upload)"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Sits centered on top of the background. Use a transparent PNG (logo, lockup, badge).
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
              const res = await uploadHomeHeroOverlay(fd);
              if (res.success) return res.url;
              throw new Error(res.error ?? "Upload failed");
            }}
            currentUrl={overlayUrl || null}
            onResolved={(url) => setOverlayUrl(url)}
          />
        </div>
      </div>

      {/* Trilingual overlay text */}
      <div className="rounded-md border border-border p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Overlay text (trilingual, optional — sits under the PNG)
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <Input
            name="home_hero_overlay_text_en"
            defaultValue={info.home_hero_overlay_text_en ?? ""}
            placeholder="EN"
          />
          <Input
            name="home_hero_overlay_text_de"
            defaultValue={info.home_hero_overlay_text_de ?? ""}
            placeholder="DE"
          />
          <Input
            name="home_hero_overlay_text_fr"
            defaultValue={info.home_hero_overlay_text_fr ?? ""}
            placeholder="FR"
          />
        </div>
      </div>

      {/* Darkening slider */}
      <div className="rounded-md border border-border p-4">
        <Label htmlFor="home_hero_darkening_strength">
          Darkening tint{" "}
          <span className="font-mono text-xs text-muted-foreground">
            {strength}%
          </span>
        </Label>
        <input
          id="home_hero_darkening_strength"
          name="home_hero_darkening_strength"
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

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save homepage hero"}
      </Button>
    </form>
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
        `File is too large (max ${Math.round(maxSizeBytes / 1024 / 1024)} MB).`
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
