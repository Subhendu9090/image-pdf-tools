import { Download, Loader2, X } from "lucide-react";
import { SegmentedControl } from "./segment-control";
import { FORMAT_OPTIONS, ImageMeta, OutputFormat } from "@/lib/image-convert";
import { Slider } from "./slider";
import { ProgressRing } from "./progress-ring";
import { cn, formatBytes } from "@/lib/utils";

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

export default ImageRow