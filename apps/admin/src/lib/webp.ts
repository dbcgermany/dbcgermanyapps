import sharp from "sharp";

/**
 * Converts an uploaded image File to WebP for storage optimization.
 * Returns { buffer, contentType, extension } for passing to Supabase Storage.
 *
 * - Skips conversion for SVG (keeps as-is) and animated GIF (sharp can't reliably
 *   preserve animation; keep original)
 * - Auto-rotates based on EXIF orientation
 * - Resizes max dimension to 2400px (prevents uploads of huge originals)
 * - Quality 85 (visually lossless for photos, ~50-70% size reduction vs JPEG)
 */
export async function toWebp(
  file: File,
  opts?: { maxDim?: number; quality?: number }
): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  const type = file.type || "";
  const rawBuffer = Buffer.from(await file.arrayBuffer());

  // Pass through non-rasterizable or animated formats untouched
  if (type === "image/svg+xml" || type === "image/gif") {
    const ext =
      type === "image/svg+xml" ? "svg" : file.name.split(".").pop() || "gif";
    return { buffer: rawBuffer, contentType: type, extension: ext };
  }

  const maxDim = opts?.maxDim ?? 2400;
  const quality = opts?.quality ?? 85;

  try {
    const webpBuffer = await sharp(rawBuffer, { failOn: "error" })
      .rotate() // respect EXIF
      .resize({ width: maxDim, height: maxDim, fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    return {
      buffer: webpBuffer,
      contentType: "image/webp",
      extension: "webp",
    };
  } catch {
    // If sharp fails (corrupt file, unsupported format), return the raw file
    const ext = file.name.split(".").pop() || "bin";
    return {
      buffer: rawBuffer,
      contentType: type || "application/octet-stream",
      extension: ext.toLowerCase(),
    };
  }
}
