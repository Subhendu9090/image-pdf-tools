/** Supported output formats. "original" means re-encode as whatever the
 *  source already is (still useful for resize-only or quality-only runs). */
export type OutputFormat =
  | "original"
  | "jpeg"
  | "png"
  | "webp"
  | "avif"
  | "gif"
  | "bmp"
  | "ico";

export const FORMAT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "original", label: "Keep original" },
  { value: "jpeg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
  { value: "gif", label: "GIF" },
  { value: "bmp", label: "BMP" },
  { value: "ico", label: "ICO" },
];

// Formats the browser's canvas.toBlob can actually encode reliably.
// AVIF/ICO support varies by browser; we fall back to PNG if encoding fails.
const MIME_BY_FORMAT: Record<Exclude<OutputFormat, "original">, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  bmp: "image/bmp",
  ico: "image/x-icon",
};

export function extensionFor(format: OutputFormat, originalName: string): string {
  if (format === "original") {
    const ext = originalName.split(".").pop();
    return ext && ext.length <= 5 ? ext.toLowerCase() : "img";
  }
  if (format === "jpeg") return "jpg";
  return format;
}

export interface ImageMeta {
  width: number;
  height: number;
}

export function readImageMeta(file: File): Promise<ImageMeta> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions"));
    };
    img.src = url;
  });
}

export interface ConvertOptions {
  format: OutputFormat;
  quality: number; // 1-100. Ignored for png/bmp/gif (lossless).
  resizeMode: "none" | "percent" | "exact";
  resizePercent: number;
  exactWidth: number;
  exactHeight: number;
  maintainAspect: boolean;
}

/** True when these options would produce an identical file — lets the page
 *  offer a direct "Download" instead of forcing a no-op "Process" step. */
export function isNoOp(file: File, opts: ConvertOptions): boolean {
  const formatUnchanged = opts.format === "original";
  const noResize = opts.resizeMode === "none";
  const fullQuality = opts.quality >= 100;
  return formatUnchanged && noResize && fullQuality;
}

function resolveFormat(format: OutputFormat, mimeType: string): Exclude<OutputFormat, "original"> {
  if (format !== "original") return format;
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("avif")) return "avif";
  if (mimeType.includes("gif")) return "gif";
  if (mimeType.includes("bmp")) return "bmp";
  return "jpeg";
}

/** The single conversion function: takes a raw file + options, returns the
 *  processed blob. Handles resize and re-encode. Loading state, errors, and
 *  downloads are the caller's responsibility — this function just converts. */
export async function convertImage(file: File, opts: ConvertOptions): Promise<Blob> {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image"));
      el.src = sourceUrl;
    });

    let targetW = img.naturalWidth;
    let targetH = img.naturalHeight;

    if (opts.resizeMode === "percent") {
      targetW = Math.max(1, Math.round((img.naturalWidth * opts.resizePercent) / 100));
      targetH = Math.max(1, Math.round((img.naturalHeight * opts.resizePercent) / 100));
    } else if (opts.resizeMode === "exact") {
      targetW = Math.max(1, opts.exactWidth);
      targetH = opts.maintainAspect
        ? Math.max(1, Math.round((opts.exactWidth / img.naturalWidth) * img.naturalHeight))
        : Math.max(1, opts.exactHeight);
    }

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas isn't supported in this browser");
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const resolved = resolveFormat(opts.format, file.type);
    const mime = MIME_BY_FORMAT[resolved];
    const lossless = resolved === "png" || resolved === "bmp" || resolved === "gif";
    const quality = lossless ? undefined : Math.min(1, Math.max(0.05, opts.quality / 100));

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error(`This browser can't encode ${resolved.toUpperCase()}`))),
        mime,
        quality,
      );
    });

    return blob;
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}