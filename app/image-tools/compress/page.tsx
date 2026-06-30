"use client";

import { useCallback, useState } from "react";
import {
  Download,
  Trash2,
  Image as ImageIcon,
  X,
  Loader2,
} from "lucide-react";
import { FileDropzone } from "@/components/file-dropzone";
import { Slider } from "@/components/slider";
import { formatBytes, cn } from "@/lib/utils";

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
  quality: number;
  compressedPercentage?: number;

  compressedBlob?: Blob;
  compressedUrl?: string;

  compressedSize?: number;

  error?: string;
};

export function makeId(file: File) {
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

 async function compressImage(
  file: File,
  quality: number = 80,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas not supported"));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);

          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }

          resolve(blob);
        },
        "image/jpeg", // output format
        quality / 100, // 0-1
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image"));
    };

    img.src = url;
  });
}

export default function CompressPage() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [applyToAll, setApplyToAll] = useState(true);
  const [quality, setQuality] = useState(70);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompressed, setisCompressed] = useState(false)

  function patchImage(id: string, patch: Partial<ImageItem>) {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...patch } : img)),
    );
  }

  async function processOne(image: ImageItem) {
    const imageQuality = applyToAll ? quality : image.quality;

    patchImage(image.id, {
      status: "processing",
      error: undefined,
    });

    try {
      const blob = await compressImage(image.file, imageQuality);
      const compressedUrl = URL.createObjectURL(blob);

      const savedPercent = Math.round((1 - blob.size / image.file.size) * 100);

      patchImage(image.id, {
        status: "done",
        compressedBlob: blob,
        compressedUrl,
        compressedSize: blob.size,
        compressedPercentage: savedPercent,
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
    setisCompressed(true)

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
    const blob = image.compressedBlob ?? image.file;

    const name = image.name.replace(/\.[^/.]+$/, "");
    const fileName = image.compressedBlob
      ? `${name}-compressed.jpg`
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
      quality: quality,
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
            <div className="flex flex-wrap items-center justify-center md:justify-between md:gap-3 gap-6">
             <div className="flex flex-wrap items-center gap-2">
                <div className="relative justify-center items-center rounded-full">
                  { applyToAll &&<div className="   w-64 rounded-xl border bg-white p-3 shadow-lg dark:bg-black">
                    <div className="">
                      <Slider
                        id="quality-slider"
                        value={quality}
                        min={10}
                        max={100}
                        onChange={setQuality}
                        accent="teal"
                        label="Compress"
                        valueLabel={`${quality}%`}
                      />
                    </div>
                  </div>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label
                  title="Apply the same quality to all images. Turn off to customize each image separately."
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
                        : "bg-paper-sunken bg-gray-300 dark:bg-black border border-border-strong",
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
                {isCompressed && (
                  <button
                    type="button"
                    onClick={downloadAll}
                    className="flex items-center gap-1.5 rounded-full border border-border-strong bg-paper-raised px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper-sunken"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download all
                  </button>
                )}
                {/* <button
                  type="button"
                  // onClick={globalIsNoOp ? downloadAll : runAll}
                  disabled={isRunning}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-opacity hover:opacity-90",
                    isRunning && "opacity-60",
                  )}
                >
                  {!isRunning ? (
                    <Download className="h-3.5 w-3.5" />
                  ) : (
                    <PlayCircle className="h-3.5 w-3.5" />
                  )}
                  {isRunning
                    ? "Processing…"
                    : true
                      ? `Download ${images.length} image${images.length === 1 ? "" : "s"}`
                      : `Compress ${images.length} image${images.length === 1 ? "" : "s"}`}
                </button> */}

                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1.5 rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-opacity hover:opacity-90",
                    isRunning && "opacity-60",
                  )}
                  onClick={runAll}
                  disabled={isRunning}
                >
                  {isRunning
                    ? "Processing…"
                    : `Compress ${images.length} images`}
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
              document.getElementById("add-more-input-compress")?.click()
            }
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-paper-raised px-4 mt-20 text-sm font-medium text-ink-soft transition-colors hover:bg-paper-sunken py-8"
          >
            <ImageIcon className="h-6 w-6" />
            Add more images
            <input
              id="add-more-input-compress"
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
                      {entry.status === "done" && entry.compressedUrl && (
                        <>
                          <span aria-hidden>→</span>
                          <span
                            className={cn(
                              "font-medium",
                              true ? "text-teal-600 dark:text-teal-400" : "",
                            )}
                          >
                            {formatBytes(entry.compressedSize ?? entry.file.size)}
                            {true ? ` (-${entry.compressedPercentage}%)` : ""}
                          </span>
                        </>
                      )}
                    </div>
                    {entry.status === "error" && (
                      <p className="mt-0.5 text-xs text-danger">{entry.error}</p>
                    )}
                  </div>

                  {!applyToAll && (
                    <div className="mt-3 w-full sm:w-auto">
                      <Slider
                        value={entry.quality}
                        onChange={(q) => patchImage(entry.id, { quality: q })}
                        valueLabel={`${entry.quality}%`}
                        min={10}
                        max={100}
                        accent="teal"
                        label="Quality"
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
                      aria-label={`Remove ${entry.name}`}
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
