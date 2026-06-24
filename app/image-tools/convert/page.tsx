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
import {
  convertImage,
  isNoOp,
  extensionFor,
  readImageMeta,
  FORMAT_OPTIONS,
  type ConvertOptions,
  type OutputFormat,
  type ImageMeta,
} from "@/lib/image-convert";

interface ImageEntry {
  id: string;
  file: File;
  previewUrl: string;
}

type Status = "idle" | "processing" | "done" | "error";

interface ImageMetaState extends Partial<ImageMeta> {
  status: Status;
  progress: number;
  resultBlob?: Blob;
  resultUrl?: string;
  error?: string;
  format?: OutputFormat;
}

const DEFAULT_META: ImageMetaState = {
  status: "idle",
  progress: 0,
  format: "original",
};

function makeId(file: File) {
  return `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ConvertPage() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [meta, setMeta] = useState<Record<string, ImageMetaState>>({});

  const [applyToAll, setApplyToAll] = useState(true);
  const [format, setFormat] = useState<OutputFormat>("original");
  const [isRunning, setIsRunning] = useState(false);

  const patchMeta = useCallback((id: string, patch: Partial<ImageMetaState>) => {
    setMeta((prev) => ({
      ...prev,
      [id]: { ...DEFAULT_META, ...prev[id], ...patch },
    }));
  }, []);

  const handleFiles = useCallback(
    (files: File[]) => {
      const accepted = files.filter((f) => f.type.startsWith("image/"));

      const entries: ImageEntry[] = accepted.map((file) => ({
        id: makeId(file),
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      setImages((prev) => [...prev, ...entries]);

      entries.forEach((entry) => {
        setMeta((prev) => ({ ...prev, [entry.id]: { ...DEFAULT_META } }));
        readImageMeta(entry.file)
          .then((dims) => patchMeta(entry.id, dims))
          .catch(() => patchMeta(entry.id, { width: 0, height: 0 }));
      });
    },
    [patchMeta],
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setMeta((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setMeta({});
  }, [images]);

  const optionsFor = useCallback(
    (id: string): ConvertOptions => {
      const m = meta[id];
      const effFormat = applyToAll ? format : (m?.format ?? "original");
      return {
        format: effFormat,
        quality: 100,
        resizeMode: "none",
        resizePercent: 100,
        exactWidth: 0,
        exactHeight: 0,
        maintainAspect: true,
      };
    },
    [applyToAll, format, meta],
  );

  const globalIsNoOp = useMemo(() => format === "original", [format]);

  const processOne = useCallback(
    async (entry: ImageEntry) => {
      const opts = optionsFor(entry.id);
      patchMeta(entry.id, { status: "processing", progress: 30, error: undefined });
      try {
        const blob = await convertImage(entry.file, opts);
        const resultUrl = URL.createObjectURL(blob);
        patchMeta(entry.id, { status: "done", progress: 100, resultBlob: blob, resultUrl });
      } catch (err) {
        patchMeta(entry.id, {
          status: "error",
          progress: 0,
          error: err instanceof Error ? err.message : "Couldn't process this image",
        });
      }
    },
    [optionsFor, patchMeta],
  );

  const downloadOne = useCallback(
    (entry: ImageEntry) => {
      const m = meta[entry.id];
      const opts = optionsFor(entry.id);
      const baseName = entry.file.name.replace(/\.[^/.]+$/, "");
      const ext = extensionFor(opts.format, entry.file.name);
      const url = m?.resultUrl ?? entry.previewUrl;
      const a = document.createElement("a");
      a.href = url;
      a.download = `${baseName}.${ext}`;
      a.click();
    },
    [meta, optionsFor],
  );

  const runAll = useCallback(async () => {
    setIsRunning(true);
    for (const entry of images) {
      const opts = optionsFor(entry.id);
      if (isNoOp(entry.file, opts)) {
        patchMeta(entry.id, { status: "done", progress: 100 });
        continue;
      }
      await processOne(entry);
    }
    setIsRunning(false);
  }, [images, optionsFor, processOne, patchMeta]);

  const downloadAll = useCallback(() => {
    images.forEach((entry) => downloadOne(entry));
  }, [images, downloadOne]);

  const doneCount = images.filter((img) => meta[img.id]?.status === "done").length;

  const totalOriginal = useMemo(
    () => images.reduce((s, i) => s + i.file.size, 0),
    [images],
  );
  const totalResult = useMemo(
    () => images.reduce((s, i) => s + (meta[i.id]?.resultBlob?.size ?? i.file.size), 0),
    [images, meta],
  );

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
                <div className="relative w-fit">
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
                </div>
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

            {doneCount > 0 && totalOriginal > 0 && !globalIsNoOp && (
              <p className="mt-2 text-xs text-ink-faint">
                Total: {formatBytes(totalOriginal)} → {formatBytes(totalResult)}
                {totalResult < totalOriginal &&
                  ` (saved ${Math.round((1 - totalResult / totalOriginal) * 100)}%)`}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => document.getElementById("add-more-input-convert")?.click()}
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
              const m = meta[entry.id] ?? DEFAULT_META;
              const savings =
                m.resultBlob && m.resultBlob.size < entry.file.size
                  ? Math.round((1 - m.resultBlob.size / entry.file.size) * 100)
                  : null;

              return (
                <li
                  key={entry.id}
                  className="flex flex-wrap relative items-center gap-3 rounded-lg border border-border bg-paper-raised p-2.5 shadow-soft"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.previewUrl}
                    alt={entry.file.name}
                    className="h-18 w-18 shrink-0 rounded-md object-cover"
                  />

                  <div className="min-w-0 flex-1 flex-wrap">
                    <p className="truncate text-sm font-medium text-ink" title={entry.file.name}>
                      {entry.file.name}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-faint">
                      <span>{formatBytes(entry.file.size)}</span>
                      {m.width !== undefined && m.width > 0 && (
                        <>
                          <span aria-hidden>·</span>
                          <span>
                            {m.width}×{m.height}
                          </span>
                        </>
                      )}
                      {m.status === "done" && m.resultBlob && (
                        <>
                          <span aria-hidden>→</span>
                          <span
                            className={cn(
                              "font-medium",
                              savings ? "text-teal-600 dark:text-teal-400" : "",
                            )}
                          >
                            {formatBytes(m.resultBlob.size)}
                            {savings ? ` (-${savings}%)` : ""}
                          </span>
                        </>
                      )}
                    </div>
                    {m.status === "error" && (
                      <p className="mt-0.5 text-xs text-danger">{m.error}</p>
                    )}
                  </div>

                  {!applyToAll && (
                    <div>
                      <SegmentedControl
                        options={FORMAT_OPTIONS}
                        value={m.format ?? "original"}
                        onChange={(f) => patchMeta(entry.id, { format: f })}
                        accent="teal"
                        size="sm"
                      />
                    </div>
                  )}

                  <div className="flex shrink-0 items-center gap-1">
                    {m.status === "processing" && (
                      <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
                    )}
                    {m.status === "done" && (
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
                    {m.status === "error" && (
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