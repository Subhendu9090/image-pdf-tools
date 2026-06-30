"use client";

import { useCallback, useState } from "react";
import {
  Download,
  PlayCircle,
  Trash2,
  Image as ImageIcon,
  X,
  Loader2,
  Maximize2,
  Square,
} from "lucide-react";
import { FileDropzone } from "@/components/file-dropzone";
import { SegmentedControl } from "@/components/segment-control";
import { formatBytes, cn } from "@/lib/utils";

export type ResizeMode = "percentage" | "pixels" | "preset";

export type PresetSize = {
  label: string;
  width: number;
  height: number;
};

export const PRESET_OPTIONS: PresetSize[] = [
  { label: "Instagram (1:1)", width: 1080, height: 1080 },
  { label: "Instagram Portrait (4:5)", width: 1080, height: 1350 },
  { label: "Instagram Landscape (1.91:1)", width: 1080, height: 566 },
  { label: "Twitter (2:1)", width: 1200, height: 600 },
  { label: "Facebook (1.91:1)", width: 1200, height: 630 },
  { label: "YouTube Thumbnail (16:9)", width: 1280, height: 720 },
  { label: "LinkedIn (1.91:1)", width: 1200, height: 627 },
  { label: "Pinterest (2:3)", width: 735, height: 1102 },
  { label: "HD (16:9)", width: 1920, height: 1080 },
  { label: "4K (16:9)", width: 3840, height: 2160 },
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
  resultBlob?: Blob;
  resultUrl?: string;
  resultSize?: number;
  error?: string;
  resizeWidth?: number;
  resizeHeight?: number;
  resizeMode?: ResizeMode;
  customWidth?: number;
  customHeight?: number;
  preserveAspectRatio?: boolean;
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

export async function resizeImage(
  file: File,
  width: number,
  height: number,
  preserveAspect: boolean = true,
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

      let finalWidth = width;
      let finalHeight = height;

      if (preserveAspect) {
        const aspectRatio = img.width / img.height;
        const targetAspect = width / height;

        if (aspectRatio > targetAspect) {
          finalWidth = width;
          finalHeight = width / aspectRatio;
        } else {
          finalHeight = height;
          finalWidth = height * aspectRatio;
        }
      }

      canvas.width = finalWidth;
      canvas.height = finalHeight;

      // Enable high-quality image scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);

          if (!blob) {
            reject(new Error("Failed to resize image."));
            return;
          }

          resolve(blob);
        },
        file.type || "image/png",
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

export default function ResizePage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [applyToAll, setApplyToAll] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [resizeMode, setResizeMode] = useState<ResizeMode>("preset");
  const [preserveAspect, setPreserveAspect] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<PresetSize>(
    PRESET_OPTIONS[0],
  );
  const [customWidth, setCustomWidth] = useState<number>(800);
  const [customHeight, setCustomHeight] = useState<number>(600);
  const [percentage, setPercentage] = useState<number>(50);

  const patchImage = useCallback((id: string, patch: Partial<ImageItem>) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...patch } : img)),
    );
  }, []);

  async function processOne(image: ImageItem) {
    let width: number, height: number;

    if (applyToAll) {
      switch (resizeMode) {
        case "preset":
          width = selectedPreset.width;
          height = selectedPreset.height;
          break;
        case "pixels":
          width = customWidth;
          height = customHeight;
          break;
        case "percentage":
          width = Math.round((image.meta.width * percentage) / 100);
          height = Math.round((image.meta.height * percentage) / 100);
          break;
        default:
          width = image.meta.width;
          height = image.meta.height;
      }
    } else {
      width = image.customWidth ?? image.meta.width;
      height = image.customHeight ?? image.meta.height;
    }

    patchImage(image.id, {
      status: "processing",
      error: undefined,
    });

    try {
      const blob = await resizeImage(
        image.file,
        width,
        height,
        applyToAll ? preserveAspect : (image.preserveAspectRatio ?? true),
      );
      const resizedUrl = URL.createObjectURL(blob);

      patchImage(image.id, {
        status: "done",
        resultBlob: blob,
        resultUrl: resizedUrl,
        resultSize: blob.size,
      });
    } catch (error) {
      patchImage(image.id, {
        status: "error",
        error: "Resize failed",
      });
    }
  }

  async function runAll() {
    setIsRunning(true);

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

  function downloadOne(image: ImageItem) {
    const blob = image.resultBlob ?? image.file;
    const name = image.name.replace(/\.[^/.]+$/, "");
    const ext = image.name.split(".").pop();
    const fileName = image.resultBlob ? `${name}-resized.${ext}` : image.name;
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
      resizeWidth: dimensions.width,
      resizeHeight: dimensions.height,
      preserveAspectRatio: true,
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

  const doneCount = images.filter((img) => img.status === "done").length;

  const getSizeLabel = () => {
    if (applyToAll) {
      switch (resizeMode) {
        case "preset":
          return `${selectedPreset.width}×${selectedPreset.height}`;
        case "pixels":
          return `${customWidth}×${customHeight}`;
        case "percentage":
          return `${percentage}%`;
        default:
          return "";
      }
    }
    return "Custom per image";
  };

  return (
    <>
      {images.length === 0 ? (
        <FileDropzone
          accept="image/*"
          multiple
          onFiles={handleFiles}
          accent="teal"
          title="Drop images here, or click to browse"
          subtitle="Resize images to exact dimensions — one file or many at once"
          hint="Files stay in your browser. Nothing uploads to a server."
        />
      ) : (
        <>
          <div className="sticky top-16 z-30 -mx-4 mb-5 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {applyToAll && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <SegmentedControl
                        options={[
                          { value: "preset", label: "Preset" },
                          { value: "pixels", label: "Pixels" },
                          { value: "percentage", label: "%" },
                        ]}
                        value={resizeMode}
                        onChange={(mode) => setResizeMode(mode as ResizeMode)}
                        accent="teal"
                        size="sm"
                      />
                    </div>

                    {resizeMode === "preset" && (
                      <select
                        value={PRESET_OPTIONS.indexOf(selectedPreset)}
                        onChange={(e) =>
                          setSelectedPreset(
                            PRESET_OPTIONS[parseInt(e.target.value)],
                          )
                        }
                        className="rounded-full w-fit border border-sand-300 py-2 pl-4 pr-8 text-sm text-ink shadow-sm outline-none dark:bg-black transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                      >
                        {PRESET_OPTIONS.map((preset, index) => (
                          <option key={index} value={index}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {resizeMode === "pixels" && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={customWidth}
                          onChange={(e) =>
                            setCustomWidth(
                              Math.max(1, parseInt(e.target.value) || 1),
                            )
                          }
                          min={1}
                          className="w-20 rounded-full border border-sand-300 px-3 py-2 text-sm text-ink shadow-sm outline-none dark:bg-black transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                          placeholder="W"
                        />
                        <span className="text-ink-faint">×</span>
                        <input
                          type="number"
                          value={customHeight}
                          onChange={(e) =>
                            setCustomHeight(
                              Math.max(1, parseInt(e.target.value) || 1),
                            )
                          }
                          min={1}
                          className="w-20 rounded-full border border-sand-300 px-3 py-2 text-sm text-ink shadow-sm outline-none dark:bg-black transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                          placeholder="H"
                        />
                      </div>
                    )}

                    {resizeMode === "percentage" && (
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={1}
                          max={200}
                          value={percentage}
                          onChange={(e) =>
                            setPercentage(parseInt(e.target.value))
                          }
                          className="w-32 accent-teal-500"
                        />
                        <span className="text-sm font-medium text-ink">
                          {percentage}%
                        </span>
                      </div>
                    )}

                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ink-soft">
                      <input
                        type="checkbox"
                        checked={preserveAspect}
                        onChange={(e) => setPreserveAspect(e.target.checked)}
                        className="rounded border-border-strong text-teal-500 focus:ring-teal-500"
                      />
                      <Square className="h-3 w-3" />
                      Keep ratio
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label
                  title="Apply the same size to all images. Turn off to customize each image separately."
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
                        applyToAll ? "translate-x-5.5" : "translate-x-0.75",
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
                  onClick={runAll}
                  disabled={isRunning}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-opacity hover:opacity-90",
                    isRunning && "opacity-60",
                  )}
                >
                  {isRunning ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <PlayCircle className="h-3.5 w-3.5" />
                  )}
                  {isRunning
                    ? "Processing…"
                    : `Resize ${images.length} image${images.length === 1 ? "" : "s"}`}
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

            <div className="mt-2 flex items-center gap-3 text-xs text-ink-faint">
              <span>Size: {getSizeLabel()}</span>
              {doneCount > 0 && (
                <span>
                  {doneCount} of {images.length} processed
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              document.getElementById("add-more-input-resize")?.click()
            }
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-paper-raised px-4 mt-20 text-sm font-medium text-ink-soft transition-colors hover:bg-paper-sunken py-8"
          >
            <ImageIcon className="h-6 w-6" />
            Add more images
            <input
              id="add-more-input-resize"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
            />
          </button>

          <ul className="flex flex-col gap-4">
            {images.map((entry) => {
              const showCustomControls = !applyToAll;

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
                      <span aria-hidden>·</span>
                      <span>
                        {entry.meta.width}×{entry.meta.height}
                      </span>
                      {entry.status === "done" && entry.resultBlob && (
                        <>
                          <span aria-hidden>→</span>
                          <span>{formatBytes(entry.resultBlob.size)}</span>
                        </>
                      )}
                    </div>
                    {entry.status === "error" && (
                      <p className="mt-0.5 text-xs text-danger">
                        {entry?.error}
                      </p>
                    )}
                  </div>

                  {showCustomControls && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={entry.customWidth ?? entry.meta.width}
                        onChange={(e) =>
                          patchImage(entry.id, {
                            customWidth: Math.max(
                              1,
                              parseInt(e.target.value) || 1,
                            ),
                          })
                        }
                        min={1}
                        className="w-16 rounded-full border border-sand-300 px-2 py-1 text-xs text-ink shadow-sm outline-none dark:bg-black transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                        placeholder="W"
                      />
                      <span className="text-ink-faint text-xs">×</span>
                      <input
                        type="number"
                        value={entry.customHeight ?? entry.meta.height}
                        onChange={(e) =>
                          patchImage(entry.id, {
                            customHeight: Math.max(
                              1,
                              parseInt(e.target.value) || 1,
                            ),
                          })
                        }
                        min={1}
                        className="w-16 rounded-full border border-sand-300 px-2 py-1 text-xs text-ink shadow-sm outline-none dark:bg-black transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                        placeholder="H"
                      />
                      <label className="flex cursor-pointer items-center gap-1 text-xs text-ink-soft">
                        <input
                          type="checkbox"
                          checked={entry.preserveAspectRatio ?? true}
                          onChange={(e) =>
                            patchImage(entry.id, {
                              preserveAspectRatio: e.target.checked,
                            })
                          }
                          className="rounded border-border-strong text-teal-500 focus:ring-teal-500"
                        />
                        <Maximize2 className="h-3 w-3" />
                      </label>
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
