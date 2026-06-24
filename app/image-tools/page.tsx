"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Repeat,
  Minimize2,
  Crop,
  Download,
  PlayCircle,
  Trash2,
  Image as ImageIcon,
  X,
  Loader2,
} from "lucide-react";
import { FileDropzone } from "@/components/file-dropzone";
import { SegmentedControl } from "@/components/segment-control";
import { Slider } from "@/components/slider";
import { ProgressRing } from "@/components/progress-ring";
import { formatBytes, cn } from "@/lib/utils";
import {
  convertImage,
  isNoOp,
  extensionFor,
  readImageMeta,
  FORMAT_OPTIONS,
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
  // per-file overrides, only read when global "apply to all" is off
  format?: OutputFormat;
  quality?: number;
}

const DEFAULT_META: ImageMetaState = {
  status: "idle",
  progress: 0,
  format: "original",
  quality: 100,
};

function makeId(file: File) {
  return `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function ImageToolsPage() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [meta, setMeta] = useState<Record<string, ImageMetaState>>({});

  // Global settings (used when applyToAll is true)
  const [applyToAll, setApplyToAll] = useState(true);
  const [format, setFormat] = useState<OutputFormat>("original");
  const [reduceQuality, setReduceQuality] = useState(false); // off by default
  const [quality, setQuality] = useState(90);
  const [resizeMode, setResizeMode] = useState<"none" | "percent" | "exact">(
    "none",
  );
  const [resizePercent, setResizePercent] = useState(100);
  const [exactWidth, setExactWidth] = useState(1920);
  const [exactHeight, setExactHeight] = useState(1080);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const patchMeta = useCallback(
    (id: string, patch: Partial<ImageMetaState>) => {
      setMeta((prev) => ({
        ...prev,
        [id]: { ...DEFAULT_META, ...prev[id], ...patch },
      }));
    },
    [],
  );

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

  // Are the active settings a true no-op (nothing to actually process)?
  const globalIsNoOp = useMemo(
    () =>
      applyToAll &&
      format === "original" &&
      resizeMode === "none" &&
      (!reduceQuality || quality >= 100),
    [applyToAll, format, resizeMode, reduceQuality, quality],
  );

  const optionsFor = useCallback(
    (id: string) => {
      const m = meta[id];
      const effFormat = applyToAll ? format : (m?.format ?? "original");
      const effQuality = applyToAll
        ? reduceQuality
          ? quality
          : 100
        : (m?.quality ?? 100);
      return {
        format: effFormat,
        quality: effQuality,
        resizeMode: applyToAll ? resizeMode : ("none" as const),
        resizePercent,
        exactWidth,
        exactHeight,
        maintainAspect,
      };
    },
    [
      applyToAll,
      format,
      reduceQuality,
      quality,
      resizeMode,
      resizePercent,
      exactWidth,
      exactHeight,
      maintainAspect,
      meta,
    ],
  );

  // ---------- The one conversion entry point --------------------------
  const processOne = useCallback(
    async (entry: ImageEntry) => {
      const opts = optionsFor(entry.id);
      patchMeta(entry.id, {
        status: "processing",
        progress: 30,
        error: undefined,
      });
      try {
        // console.log("entry",entry,"opts",opts)
        const blob = await convertImage(entry.file, opts);
        const resultUrl = URL.createObjectURL(blob);
        patchMeta(entry.id, {
          status: "done",
          progress: 100,
          resultBlob: blob,
          resultUrl,
        });
      } catch (err) {
        patchMeta(entry.id, {
          status: "error",
          progress: 0,
          error:
            err instanceof Error ? err.message : "Couldn't process this image",
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
      const url = m?.resultUrl ?? entry.previewUrl; // no-op: download the original
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

  const doneCount = images.filter(
    (img) => meta[img.id]?.status === "done",
  ).length;

  const totalOriginal = useMemo(
    () => images.reduce((s, i) => s + i.file.size, 0),
    [images],
  );
  const totalResult = useMemo(
    () =>
      images.reduce(
        (s, i) => s + (meta[i.id]?.resultBlob?.size ?? i.file.size),
        0,
      ),
    [images, meta],
  );

  const [qualityOpen, setQualityOpen] = useState(false); // dialog open/close
  const [resizeOpen, setResizeOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      {/* SEO-friendly semantic header */}
      <header className="mb-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300">
            <ImageIcon className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Image tools
            </h1>
            <p className="mt-1 max-w-xl text-sm text-ink-soft">
              Convert, compress, and resize JPG, PNG, WebP, AVIF, GIF, BMP, and
              ICO images. Upload one file or a whole batch — everything runs in
              your browser.
            </p>
          </div>
        </div>
      </header>

      {/* Upload zone */}
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
          {/* Sticky top action bar: settings + process/download, always visible */}
          <div className="sticky top-16 z-30 -mx-4 mb-5 border-b border-border bg-paper/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className=" relative  justify-center items-center rounded-full   ">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !reduceQuality;
                      setReduceQuality(next);
                      setQualityOpen(next);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                      reduceQuality
                        ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                        : "border-border bg-paper-raised text-ink-soft hover:bg-paper-sunken",
                    )}
                  >
                    <Minimize2 className="h-4 w-4" />
                    Compress
                  </button>

                  {reduceQuality && qualityOpen && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border bg-white p-3 shadow-lg dark:bg-black">
                      <button
                        type="button"
                        onClick={() => setQualityOpen(false)}
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-ink-faint hover:bg-paper-sunken hover:text-ink"
                        aria-label="Close quality settings"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      <div className="pr-7">
                        <Slider
                          id="quality-slider"
                          value={quality}
                          min={10}
                          max={100}
                          onChange={setQuality}
                          accent="teal"
                          label="Quality"
                          valueLabel={`${quality}%`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div
                  title="Scale every image by percentage, or set exact pixel dimensions."
                  className="relative"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (resizeMode === "none") {
                        setResizeMode("percent");
                        setResizeOpen(true);
                      } else {
                        setResizeOpen((v) => !v);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition-colors",
                      resizeMode !== "none"
                        ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                        : "border-border bg-paper-raised text-ink-soft hover:bg-paper-sunken",
                    )}
                  >
                    <Crop className="h-3.5 w-3.5" />
                    Resize
                  </button>

                  {resizeOpen && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-white p-3 shadow-lg dark:bg-black">
                      <button
                        type="button"
                        onClick={() => setResizeOpen(false)}
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-ink-faint hover:bg-paper-sunken hover:text-ink"
                        aria-label="Close resize settings"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      <div className="pr-7">
                        <SegmentedControl
                          options={[
                            { value: "none", label: "Original" },
                            { value: "percent", label: "Scale %" },
                            { value: "exact", label: "Exact" },
                          ]}
                          value={resizeMode}
                          onChange={(value) => {
                            setResizeMode(value);
                            if (value === "none") setResizeOpen(false);
                          }}
                          accent="teal"
                          size="sm"
                        />
                      </div>

                      {resizeMode === "percent" && (
                        <div className="mt-3">
                          <Slider
                            value={resizePercent}
                            min={10}
                            max={200}
                            onChange={setResizePercent}
                            accent="teal"
                            label="Scale"
                            valueLabel={`${resizePercent}%`}
                          />
                        </div>
                      )}

                      {resizeMode === "exact" && (
                        <div className="mt-3 flex flex-wrap items-end gap-3">
                          <label className="block">
                            <span className="mb-1 block text-xs text-ink-faint">
                              Width
                            </span>
                            <input
                              type="number"
                              value={exactWidth}
                              onChange={(e) =>
                                setExactWidth(Number(e.target.value))
                              }
                              className="w-24 rounded-md border border-border bg-paper px-2 py-1.5 text-sm text-ink"
                            />
                          </label>

                          {!maintainAspect && (
                            <label className="block">
                              <span className="mb-1 block text-xs text-ink-faint">
                                Height
                              </span>
                              <input
                                type="number"
                                value={exactHeight}
                                onChange={(e) =>
                                  setExactHeight(Number(e.target.value))
                                }
                                className="w-24 rounded-md border border-border bg-paper px-2 py-1.5 text-sm text-ink"
                              />
                            </label>
                          )}

                          <label className="flex items-center gap-1.5 pb-1.5 text-xs text-ink-soft">
                            <input
                              type="checkbox"
                              checked={maintainAspect}
                              onChange={(e) =>
                                setMaintainAspect(e.target.checked)
                              }
                              className="h-3.5 w-3.5 rounded border-border-strong accent-teal-500"
                            />
                            Lock ratio
                          </label>
                        </div>
                      )}

                      {resizeMode !== "none" && (
                        <button
                          type="button"
                          onClick={() => {
                            setResizeMode("none");
                            setResizeOpen(false);
                          }}
                          className="mt-3 text-xs font-medium text-ink-faint hover:text-ink"
                        >
                          Turn off resize
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="relative w-fit">
                  <Repeat className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink" />

                  <select
                    value={format}
                    title="Choose the file type every output is saved as."
                    onChange={(e:any) => setFormat(e.target.value)}
                    className=" w-fit rounded-full border border-sand-300  py-2 pl-9 pr-4 text-sm text-ink shadow-sm outline-none dark:bg-black  transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                  >
                    <option value={"original"}>{"Convert format"}</option>
                    {FORMAT_OPTIONS.map((option) => (
                      <option
                        className=""
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Primary action: Process or Download depending on settings */}
              <div className="flex items-center gap-2">
                <label
                  title="Apply the same settings to all images. Turn off to customize each image separately."
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
                      : `Process ${images.length} image${images.length === 1 ? "" : "s"}`}
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

          {/* Add more */}
          <button
            type="button"
            onClick={() => document.getElementById("add-more-input")?.click()}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-paper-raised px-4 mt-20  text-sm font-medium text-ink-soft transition-colors hover:bg-paper-sunken py-8"
          >
            <ImageIcon className="h-6 w-6" />
            Add more images
            <input
              id="add-more-input"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
            />
          </button>

          {/* Single column list — image + its own metadata + controls together */}
          <ul className="flex flex-col gap-4">
            {images.map((entry) => (
              <ImageRow
                key={entry.id}
                entry={entry}
                meta={meta[entry.id] ?? DEFAULT_META}
                applyToAll={applyToAll}
                reduceQualityEnabled={reduceQuality}
                onRemove={() => removeImage(entry.id)}
                onProcess={() => processOne(entry)}
                onDownload={() => downloadOne(entry)}
                onFormatChange={(f) => patchMeta(entry.id, { format: f })}
                onQualityChange={(q) => patchMeta(entry.id, { quality: q })}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// ---------- Single row: thumbnail + metadata + per-row controls ---------

function ImageRow({
  entry,
  meta,
  applyToAll,
  reduceQualityEnabled,
  onRemove,
  onProcess,
  onDownload,
  onFormatChange,
  onQualityChange,
}: {
  entry: ImageEntry;
  meta: ImageMetaState;
  applyToAll: boolean;
  reduceQualityEnabled: boolean;
  onRemove: () => void;
  onProcess: () => void;
  onDownload: () => void;
  onFormatChange: (f: OutputFormat) => void;
  onQualityChange: (q: number) => void;
}) {
  const savings =
    meta.resultBlob && meta.resultBlob.size < entry.file.size
      ? Math.round((1 - meta.resultBlob.size / entry.file.size) * 100)
      : null;

  return (
    <li className="flex flex-wrap relative items-center gap-3 rounded-lg border border-border bg-paper-raised p-2.5 shadow-soft">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={entry.previewUrl}
        alt={entry.file.name}
        className="h-18 w-18 shrink-0 rounded-md object-cover"
      />

      <div className="min-w-0 flex-1 flex-wrap">
        <p
          className="truncate text-sm font-medium text-ink"
          title={entry.file.name}
        >
          {entry.file.name}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 font-mono text-xs text-ink-faint">
          <span>{formatBytes(entry.file.size)}</span>
          {meta.width !== undefined && meta.width > 0 && (
            <>
              <span aria-hidden>·</span>
              <span>
                {meta.width}×{meta.height}
              </span>
            </>
          )}
          {meta.status === "done" && meta.resultBlob && (
            <>
              <span aria-hidden>→</span>
              <span
                className={cn(
                  "font-medium",
                  savings ? "text-teal-600 dark:text-teal-400" : "",
                )}
              >
                {formatBytes(meta.resultBlob.size)}
                {savings ? ` (-${savings}%)` : ""}
              </span>
            </>
          )}
        </div>
        {meta.status === "error" && (
          <p className="mt-0.5 text-xs text-danger">{meta.error}</p>
        )}
      </div>

      {/* Per-file override, only shown when global apply-to-all is off */}
      {!applyToAll && (
        <div>
          <SegmentedControl
            options={FORMAT_OPTIONS}
            value={meta.format ?? "original"}
            onChange={onFormatChange}
            accent="teal"
            size="sm"
          />
          {reduceQualityEnabled && (
            <div className="mt-3">
              <Slider
                value={meta.quality ?? 100}
                min={10}
                max={100}
                onChange={onQualityChange}
                accent="teal"
                label="Quality"
                valueLabel={`${meta.quality ?? 100}%`}
              />
            </div>
          )}
        </div>
      )}

      {/* Status / row action */}
      <div className="flex  shrink-0 items-center gap-1">
        {meta.status === "processing" && (
          <ProgressRing
            progress={meta.progress}
            size={26}
            accent="teal"
            state="processing"
          />
        )}
        {meta.status === "done" && (
          <button
            title="Download"
            type="button"
            onClick={onDownload}
            aria-label={`Download ${entry.file.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-600 hover:bg-teal-100 dark:bg-teal-900/40 dark:text-teal-300"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        )}
        {meta.status === "error" && (
          <button
            title="Try again"
            type="button"
            onClick={onProcess}
            aria-label={`Retry ${entry.file.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-soft text-danger"
          >
            <Loader2 className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="button"
          title=" Remove"
          onClick={onRemove}
          aria-label={`Remove ${entry.file.name}`}
          className="flex absolute bg-gray-200 dark:bg-gray-900 -top-3 -right-3 h-8 w-8 cursor-pointer  items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-paper-sunken hover:text-ink"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </li>
  );
}
