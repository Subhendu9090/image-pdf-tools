"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Sparkles,
  Download,
  PlayCircle,
  Trash2,
  Image as ImageIcon,
  X,
  Loader2,
} from "lucide-react";
import { FileDropzone } from "@/components/file-dropzone";
import { Slider } from "@/components/slider";
import { formatBytes, cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Local, self-contained enhance pipeline (mirrors the pattern used on the
// Convert page: read dimensions with a plain <img>, process on a <canvas>).
// Sharpen uses a 3x3 unsharp-style convolution kernel scaled by intensity;
// brighten shifts every channel by a fixed offset. Both run entirely in the
// browser — nothing is uploaded anywhere.
// ---------------------------------------------------------------------------

export type EnhanceSettings = {
  sharpen: number; // 0-100
  brighten: number; // -50 to 50
};

export function isEnhanceNoOp(settings: EnhanceSettings) {
  return settings.sharpen === 0 && settings.brighten === 0;
}

function clamp255(value: number) {
  return value < 0 ? 0 : value > 255 ? 255 : value;
}

function applyBrightness(imageData: ImageData, amount: number) {
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp255(data[i] + amount);
    data[i + 1] = clamp255(data[i + 1] + amount);
    data[i + 2] = clamp255(data[i + 2] + amount);
  }
}

function applySharpen(imageData: ImageData, amount: number) {
  // amount: 0-1. Blends identity with a classic sharpen kernel so low
  // values give a subtle lift and high values give a crisp edge boost.
  const { width, height, data } = imageData;
  const src = new Uint8ClampedArray(data);
  const center = 1 + 4 * amount;
  const side = -amount;
  const rowStride = width * 4;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * rowStride + x * 4;
      for (let c = 0; c < 3; c++) {
        const cur = src[idx + c];
        const top = src[idx - rowStride + c];
        const bottom = src[idx + rowStride + c];
        const left = src[idx - 4 + c];
        const right = src[idx + 4 + c];
        data[idx + c] = clamp255(
          cur * center + (top + bottom + left + right) * side,
        );
      }
    }
  }
}

export async function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image"));
    };

    img.src = url;
  });
}

export async function enhanceImage(
  file: File,
  settings: EnhanceSettings,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas is not supported."));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (settings.sharpen > 0) {
        applySharpen(imageData, settings.sharpen / 100);
      }
      if (settings.brighten !== 0) {
        applyBrightness(imageData, settings.brighten);
      }

      ctx.putImageData(imageData, 0, 0);

      // GIF can't be re-encoded from a canvas; fall back to PNG so we don't
      // silently lose animation frames or throw on toBlob.
      const outputType = file.type === "image/gif" ? "image/png" : file.type;

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error("Failed to process image."));
            return;
          }
          resolve(blob);
        },
        outputType,
        0.92,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image."));
    };

    img.src = url;
  });
}

// ---------------------------------------------------------------------------

export type ImageItem = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  meta: {
    width: number;
    height: number;
    size: number;
  };
  status: "idle" | "processing" | "done" | "error";
  // Per-image settings, used whenever "Apply to all" is off. Seeded from
  // the global sliders at the moment the image is added, then editable
  // independently per row.
  sharpen: number;
  brighten: number;
  resultBlob?: Blob;
  resultUrl?: string;
  error?: string;
};

function makeId(file: File) {
  return `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function EnhancePage() {
  const [images, setImages] = useState<ImageItem[]>([]);

  const [applyToAll, setApplyToAll] = useState(true);
  const [enhanceOpen, setEnhanceOpen] = useState(true);
  const [sharpen, setSharpen] = useState(40);
  const [brighten, setBrighten] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const patchImage = useCallback((id: string, patch: Partial<ImageItem>) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...patch } : img)),
    );
  }, []);

  const settingsFor = useCallback(
    (image: ImageItem): EnhanceSettings =>
      applyToAll
        ? { sharpen, brighten }
        : { sharpen: image.sharpen, brighten: image.brighten },
    [applyToAll, sharpen, brighten],
  );

  async function processOne(image: ImageItem) {
    const settings = settingsFor(image);

    patchImage(image.id, { status: "processing", error: undefined });

    try {
      const blob = await enhanceImage(image.file, settings);
      const resultUrl = URL.createObjectURL(blob);

      patchImage(image.id, {
        status: "done",
        resultBlob: blob,
        resultUrl,
      });
    } catch (error) {
      patchImage(image.id, {
        status: "error",
        error: "Couldn't enhance this image",
      });
    }
  }

  async function runAll() {
    setIsRunning(true);

    for (const image of images) {
      const settings = settingsFor(image);
      if (isEnhanceNoOp(settings)) {
        patchImage(image.id, { status: "done" });
        continue;
      }
      await processOne(image);
    }

    setIsRunning(false);
  }

  function downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadOne(image: ImageItem) {
    const blob = image.resultBlob ?? image.file;
    downloadBlob(blob, image.name);
  }

  function downloadAll() {
    images.forEach((image) => downloadOne(image));
  }

  async function readImage(file: File) {
    const dimensions = await getImageDimensions(file);

    const image: ImageItem = {
      id: makeId(file),
      name: file.name,
      file,
      meta: {
        width: dimensions.width,
        height: dimensions.height,
        size: file.size,
      },
      status: "idle",
      previewUrl: URL.createObjectURL(file),
      sharpen,
      brighten,
    };
    return image;
  }

  async function handleFiles(files: File[]) {
    try {
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      const results = await Promise.allSettled(
        imageFiles.map((file) => readImage(file)),
      );
      const imageItems = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      setImages((prev) => [...prev, ...imageItems]);
    } catch (error) {
      console.error("Error", error);
    }
  }

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
  }, [images]);

  const globalIsNoOp = applyToAll && sharpen === 0 && brighten === 0;

  const doneCount = images.filter((img) => img.status === "done").length;

  const totalOriginal = useMemo(
    () => images.reduce((sum, img) => sum + img.file.size, 0),
    [images],
  );
  const totalResult = useMemo(
    () =>
      images.reduce(
        (sum, img) => sum + (img.resultBlob?.size ?? img.file.size),
        0,
      ),
    [images],
  );

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Enhance Images Online — Sharpen &amp; Brighten Photos Free
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft sm:text-base">
          Sharpen blurry details and adjust brightness on JPG, PNG, WebP,
          AVIF, GIF, BMP, and ICO files, one at a time or in bulk. Everything
          runs locally in your browser, so your photos are never uploaded to
          a server.
        </p>
      </header>

      {images.length === 0 ? (
        <FileDropzone
          accept="image/*"
          multiple
          onFiles={handleFiles}
          accent="teal"
          title="Drop images here, or click to browse"
          subtitle="JPG, PNG, WebP, AVIF, GIF, BMP, ICO — one file or many at once"
          hint="Files stay in your browser. Nothing uploads to a server."
        />
      ) : (
        <>
          <div className="sticky top-16 z-30 -mx-4 mb-5 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setEnhanceOpen((v) => !v)}
                    aria-expanded={enhanceOpen}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                      "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
                    )}
                  >
                    <Sparkles className="h-4 w-4" />
                    Enhance
                  </button>

                  {enhanceOpen && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border bg-white p-3 shadow-lg dark:bg-black">
                      <button
                        type="button"
                        onClick={() => setEnhanceOpen(false)}
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-ink-faint hover:bg-paper-sunken hover:text-ink"
                        aria-label="Close enhance settings"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div className="space-y-4 pr-7">
                        <Slider
                          id="sharpen-slider"
                          value={sharpen}
                          min={0}
                          max={100}
                          onChange={setSharpen}
                          accent="teal"
                          label="Sharpen"
                          valueLabel={`${sharpen}%`}
                        />
                        <Slider
                          id="brighten-slider"
                          value={brighten}
                          min={-50}
                          max={50}
                          onChange={setBrighten}
                          accent="teal"
                          label="Brighten"
                          valueLabel={`${brighten}`}
                        />
                        {!applyToAll && (
                          <p className="text-xs text-ink-faint">
                            These are the starting values for new images.
                            Turn on &quot;Apply to all&quot; to change every
                            image at once, or adjust each image below.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label
                  title="Apply the same enhancement to all images. Turn off to customize each image separately."
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-border bg-paper-raised px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-paper-sunken"
                >
                  <span>Apply to all</span>
                  <span
                    role="switch"
                    aria-checked={applyToAll}
                    onClick={() => setApplyToAll((v) => !v)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                      applyToAll
                        ? "bg-teal-500"
                        : "bg-gray-300 dark:bg-black border border-border-strong",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform",
                        applyToAll ? "translate-x-[22px]" : "translate-x-[3px]",
                      )}
                    />
                  </span>
                </label>
                {doneCount > 0 && (
                  <button
                    type="button"
                    onClick={downloadAll}
                    className="flex items-center gap-1.5 rounded-full border border-border-strong bg-paper-raised px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper-sunken"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download all
                  </button>
                )}
                <button
                  type="button"
                  onClick={globalIsNoOp ? downloadAll : runAll}
                  disabled={isRunning}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-opacity hover:opacity-90",
                    isRunning && "opacity-60",
                  )}
                >
                  {globalIsNoOp ? (
                    <Download className="h-3.5 w-3.5" />
                  ) : (
                    <PlayCircle className="h-3.5 w-3.5" />
                  )}
                  {isRunning
                    ? "Processing…"
                    : globalIsNoOp
                      ? `Download ${images.length} image${images.length === 1 ? "" : "s"}`
                      : `Enhance ${images.length} image${images.length === 1 ? "" : "s"}`}
                </button>
                <button
                  type="button"
                  title="Delete All"
                  onClick={clearAll}
                  aria-label="Clear all images"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-paper-sunken hover:text-ink"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {doneCount > 0 && totalOriginal > 0 && !globalIsNoOp && (
              <p className="mt-2 text-xs text-ink-faint">
                Total: {formatBytes(totalOriginal)} → {formatBytes(totalResult)}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => document.getElementById("add-more-input-enhance")?.click()}
            className="mb-4 mt-8 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-paper-raised px-4 py-8 text-sm font-medium text-ink-soft transition-colors hover:bg-paper-sunken sm:mt-20"
          >
            <ImageIcon className="h-6 w-6" />
            Add more images
            <input
              id="add-more-input-enhance"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
            />
          </button>

          <ul className="flex flex-col gap-4">
            {images.map((entry) => {
              const settings = settingsFor(entry);
              const savings =
                entry.resultBlob && entry.resultBlob.size < entry.file.size
                  ? Math.round(
                      (1 - entry.resultBlob.size / entry.file.size) * 100,
                    )
                  : null;

              return (
                <li
                  key={entry.id}
                  className="relative flex flex-col gap-3 rounded-lg border border-border bg-paper-raised p-2.5 shadow-soft sm:flex-row sm:flex-wrap sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.previewUrl}
                      alt={`Preview of ${entry.name}`}
                      className="h-18 w-18 shrink-0 rounded-md object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate text-sm font-medium text-ink"
                        title={entry.name}
                      >
                        {entry.name}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-faint">
                        <span>{formatBytes(entry.file.size)}</span>
                        {entry.meta.width > 0 && (
                          <>
                            <span aria-hidden>·</span>
                            <span>
                              {entry.meta.width}×{entry.meta.height}
                            </span>
                          </>
                        )}
                        {entry.status === "done" && entry.resultBlob && (
                          <>
                            <span aria-hidden>→</span>
                            <span
                              className={cn(
                                "font-medium",
                                savings ? "text-teal-600 dark:text-teal-400" : "",
                              )}
                            >
                              {formatBytes(entry.resultBlob.size)}
                            </span>
                          </>
                        )}
                      </div>
                      {entry.status === "error" && (
                        <p className="mt-0.5 text-xs text-danger">
                          {entry.error}
                        </p>
                      )}
                    </div>
                  </div>

                  {!applyToAll && (
                    <div className="flex w-full flex-col gap-3 rounded-md border border-border bg-paper px-3 py-2 sm:w-56">
                      <Slider
                        id={`sharpen-${entry.id}`}
                        value={entry.sharpen}
                        min={0}
                        max={100}
                        onChange={(v) => patchImage(entry.id, { sharpen: v })}
                        accent="teal"
                        label="Sharpen"
                        valueLabel={`${entry.sharpen}%`}
                      />
                      <Slider
                        id={`brighten-${entry.id}`}
                        value={entry.brighten}
                        min={-50}
                        max={50}
                        onChange={(v) => patchImage(entry.id, { brighten: v })}
                        accent="teal"
                        label="Brighten"
                        valueLabel={`${entry.brighten}`}
                      />
                    </div>
                  )}

                  <div className="flex shrink-0 items-center gap-1 sm:ml-auto">
                    {entry.status === "processing" && (
                      <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                    )}
                    {entry.status === "done" && (
                      <button
                        title="Download"
                        type="button"
                        onClick={() => downloadOne(entry)}
                        aria-label={`Download ${entry.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-900/40 dark:text-teal-300"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {entry.status === "error" && (
                      <button
                        title="Try again"
                        type="button"
                        onClick={() => processOne(entry)}
                        aria-label={`Retry ${entry.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-soft text-danger"
                      >
                        <Loader2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {entry.status === "idle" && !isEnhanceNoOp(settings) && (
                      <button
                        title="Enhance this image"
                        type="button"
                        onClick={() => processOne(entry)}
                        aria-label={`Enhance ${entry.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-900/40 dark:text-teal-300"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Remove"
                      onClick={() => removeImage(entry.id)}
                      aria-label={`Remove ${entry.name}`}
                      className="absolute -right-3 -top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-200 text-ink-faint transition-colors hover:bg-paper-sunken hover:text-ink dark:bg-gray-900"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}