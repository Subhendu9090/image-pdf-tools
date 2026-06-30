"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Repeat,
  Download,
  PlayCircle,
  Trash2,
  Image as ImageIcon,
  X,
  Loader2,
} from "lucide-react";
import { FileDropzone } from "@/components/file-dropzone";
import { SegmentedControl } from "@/components/segment-control";
import { formatBytes, cn } from "@/lib/utils";

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
  currentFormat: OutputFormat;
  outputFormat?: OutputFormat;
  resultBlob?: Blob;
  resultUrl?: string;
  resultSize?: number;
  error?: string;
};

function makeId(file: File) {
  return `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getImageDimensions(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });

      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image"));
    };

    img.src = url;
  });
}

function getMimeType(format: OutputFormat, originalType: string) {
  switch (format) {
    case "jpeg":
      return "image/jpeg";

    case "png":
      return "image/png";

    case "webp":
      return "image/webp";

    case "avif":
      return "image/avif";

    case "bmp":
      // Canvas doesn't support exporting BMP.
      // Fallback to PNG.
      return "image/png";

    case "original":
    default:
      return originalType;
  }
}

function getOutputQuality(format: OutputFormat) {
  if (format === "png") return undefined;
  if (format === "gif") return undefined;
  if (format === "bmp") return undefined;
  if (format === "ico") return undefined;

  return 0.8;
}

export async function convertImage(
  file: File,
  convertFormat: OutputFormat,
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

      const mimeType = getMimeType(convertFormat, file.type);
      const quality = getOutputQuality(convertFormat);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);

          if (!blob) {
            reject(new Error("Failed to convert image."));
            alert("Failed to convert image.");
            return;
          }

          resolve(blob);
        },
        mimeType,
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image."));
    };

    img.src = url;
  });
}

export default function ConvertPage() {
  const [images, setImages] = useState<ImageItem[]>([]);

  const [applyToAll, setApplyToAll] = useState(true);
  const [format, setFormat] = useState<OutputFormat>("original");
  const [isRunning, setIsRunning] = useState(false);

  const patchImage = useCallback((id: string, patch: Partial<ImageItem>) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...patch } : img)),
    );
  }, []);

  async function processOne(image: ImageItem) {
    const convertFormat = applyToAll
      ? format
      : (image.outputFormat as OutputFormat);

    patchImage(image.id, {
      status: "processing",
      error: undefined,
    });

    try {
      const blob = await convertImage(image.file, convertFormat);
      const convertedUrl = URL.createObjectURL(blob);

      // const savedPercent = Math.round((1 - blob.size / image.file.size) * 100);

      patchImage(image.id, {
        status: "done",
        resultBlob: blob,
        resultUrl: convertedUrl,
        resultSize: blob.size,
      });
    } catch (error) {
      patchImage(image.id, {
        status: "error",
        error: "Compression failed",
      });
    }
  }

  async function runAll() {
    setIsRunning(true);
    // setisCompressed(true);

    for (const image of images) {
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

  function getExtension(format: OutputFormat) {
    if (format === "jpeg") return "jpg";
    if (format === "original") return "";
    return format;
  }
  function downloadOne(image: ImageItem) {
    const blob = image.resultBlob ?? image.file;

    const finalFormat = applyToAll
      ? format
      : (image.outputFormat ?? image.currentFormat);

    const name = image.name.replace(/\.[^/.]+$/, "");

    const fileName = image.resultBlob
      ? `${name}.${getExtension(finalFormat)}`
      : image.name;

    downloadBlob(blob, fileName);
  }

  function downloadAll() {
    images.forEach((image) => {
      downloadOne(image);
    });
  }

  async function readImage(file: File) {
    const dimensions = await getImageDimensions(file);

    const image: ImageItem = {
      id: makeId(file),
      name: file.name,
      file: file,
      meta: {
        width: dimensions.width,
        size: file.size,
        height: dimensions.height,
      },
      status: "idle",
      previewUrl: URL.createObjectURL(file),
      currentFormat: file.type.split("/")[1] as OutputFormat,
    };
    return image;
  }

  async function handleFiles(files: File[]) {
    try {
      const imageFiles = files.filter((file) => file.type.startsWith("image/"));

      const results = await Promise.allSettled(
        imageFiles.map((file) => readImage(file)),
      );
      console.log("results", results);
      const imageItems = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value);

      console.log("imageItems", imageItems);

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

  const globalIsNoOp = applyToAll && format === "original";

  const doneCount = images.filter((img) => img.status === "done").length;

  return (
    <>
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
                {applyToAll && <div className="relative w-fit">
                  <Repeat className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink" />
                  <select
                    value={format}
                    title="Choose the file type every output is saved as."
                    onChange={(e: any) => setFormat(e.target.value)}
                    className="w-fit rounded-full border border-sand-300 py-2 pl-9 pr-4 text-sm text-ink shadow-sm outline-none dark:bg-black transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  >
                    {FORMAT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>}
              </div>

              <div className="flex items-center gap-2">
                <label
                  title="Apply the same format to all images. Turn off to customize each image separately."
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
                        : " bg-gray-300 dark:bg-black border border-border-strong",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform",
                        applyToAll ? "translate-x-5.5" : "translate-x-0,75",
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
                      : `Convert ${images.length} image${images.length === 1 ? "" : "s"}`}
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

            {/* {doneCount > 0 && totalOriginal > 0 && !globalIsNoOp && (
              <p className="mt-2 text-xs text-ink-faint">
                Total: {formatBytes(totalOriginal)} → {formatBytes(totalResult)}
                {totalResult < totalOriginal &&
                  ` (saved ${Math.round((1 - totalResult / totalOriginal) * 100)}%)`}
              </p>
            )} */}
          </div>

          <button
            type="button"
            onClick={() =>
              document.getElementById("add-more-input-convert")?.click()
            }
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-paper-raised px-4 mt-20 text-sm font-medium text-ink-soft transition-colors hover:bg-paper-sunken py-8"
          >
            <ImageIcon className="h-6 w-6" />
            Add more images
            <input
              id="add-more-input-convert"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
            />
          </button>

          <ul className="flex flex-col gap-4">
            {images.map((entry) => {
              return (
                <li
                  key={entry.id}
                  className="flex flex-wrap relative items-center gap-3 rounded-lg border border-border bg-paper-raised p-2.5 shadow-soft"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.previewUrl}
                    alt={entry.name}
                    className="h-18 w-18 shrink-0 rounded-md object-cover"
                  />

                  <div className="min-w-0 flex-1 flex-wrap">
                    <p
                      className="truncate text-sm font-medium text-ink"
                      title={entry.name}
                    >
                      {entry.name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-faint">
                      <span>{formatBytes(entry.file.size)}</span>
                      {entry.meta.width !== undefined &&
                        entry.meta.width > 0 && (
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
                              true ? "text-teal-600 dark:text-teal-400" : "",
                            )}
                          >
                            {formatBytes(entry.resultBlob.size)}
                            {/* {savings ? ` (-${savings}%)` : ""} */}
                          </span>
                        </>
                      )}
                    </div>
                    {entry.status === "error" && (
                      <p className="mt-0.5 text-xs text-danger">
                        {entry?.error}
                      </p>
                    )}
                  </div>

                  {!applyToAll && (
                    <div>
                      <SegmentedControl
                        options={FORMAT_OPTIONS}
                        value={entry.outputFormat ?? "original"}
                        onChange={(f) =>
                          patchImage(entry.id, { outputFormat: f })
                        }
                        accent="teal"
                        size="sm"
                      />
                    </div>
                  )}

                  <div className="flex shrink-0 items-center gap-1">
                    {entry.status === "processing" && (
                      <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                    )}
                    {entry.status === "done" && (
                      <button
                        title="Download"
                        type="button"
                        onClick={() => downloadOne(entry)}
                        aria-label={`Download ${entry.file.name}`}
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
                        aria-label={`Retry ${entry.file.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-soft text-danger"
                      >
                        <Loader2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Remove"
                      onClick={() => removeImage(entry.id)}
                      aria-label={`Remove ${entry.file.name}`}
                      className="flex absolute bg-gray-200 dark:bg-gray-900 -top-3 -right-3 h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-paper-sunken hover:text-ink"
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
