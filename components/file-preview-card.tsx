"use client";

import { Check, FileText, Image as ImageIcon, Loader2, X } from "lucide-react";
import { ProgressRing } from "@/components/progress-ring";
import { formatBytes, cn } from "@/lib/utils";

export type FileStatus = "idle" | "processing" | "done" | "error";

interface FilePreviewCardProps {
  name: string;
  sizeBytes: number;
  resultSizeBytes?: number;
  previewUrl?: string; // image thumbnail, omit for PDFs
  kind: "image" | "pdf";
  status: FileStatus;
  progress?: number;
  accent?: "teal" | "amber";
  onRemove: () => void;
  rightSlot?: React.ReactNode; // per-file override controls
  errorMessage?: string;
  pageCount?: number;
}

export function FilePreviewCard({
  name,
  sizeBytes,
  resultSizeBytes,
  previewUrl,
  kind,
  status,
  progress = 0,
  accent = "teal",
  onRemove,
  rightSlot,
  errorMessage,
  pageCount,
}: FilePreviewCardProps) {
  const savings =
    resultSizeBytes !== undefined && resultSizeBytes < sizeBytes
      ? Math.round((1 - resultSizeBytes / sizeBytes) * 100)
      : null;

  return (
    <div className="animate-fade-up relative rounded-lg border border-border bg-paper-raised p-3 shadow-soft">
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        className="shrink-0 absolute bg-gray-200/30 right-0 top-0 rounded-md p-1 cursor-pointer shadow-2xl text-ink-faint transition-colors hover:bg-paper-sunken hover:text-ink"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-paper-sunken">
          {kind === "image" && previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={name}
              className="h-full w-full object-fill"
            />
          ) : kind === "image" ? (
            <ImageIcon className="h-5 w-5 text-ink-faint" />
          ) : (
            <FileText className="h-5 w-5 text-amber-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-medium text-ink" title={name}>
              {name}
            </p>
          </div>

          <div className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-ink-faint">
            <span>{formatBytes(sizeBytes)}</span>
            {pageCount !== undefined && (
              <>
                <span aria-hidden>·</span>
                <span>
                  {pageCount} page{pageCount === 1 ? "" : "s"}
                </span>
              </>
            )}
            {status === "done" && resultSizeBytes !== undefined && (
              <>
                <span aria-hidden>→</span>
                <span
                  className={cn(
                    "font-medium",
                    savings
                      ? "text-teal-600 dark:text-teal-400"
                      : "text-ink-faint",
                  )}
                >
                  {formatBytes(resultSizeBytes)}
                  {savings ? ` (-${savings}%)` : ""}
                </span>
              </>
            )}
          </div>

          {status === "error" && errorMessage && (
            <p className="mt-1 text-xs text-danger">{errorMessage}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center pr-5">
          {/* {status === "idle" && rightSlot} */}
          {status === "processing" && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-faint" />
              <ProgressRing
                progress={progress}
                size={28}
                accent={accent}
                state="processing"
              />
            </div>
          )}
          {status === "done" && (
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full",
                accent === "teal"
                  ? "bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-300"
                  : "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
              )}
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </span>
          )}
          {status === "error" && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-danger-soft text-danger">
              <X className="h-4 w-4" strokeWidth={2.5} />
            </span>
          )}
        </div>
      </div>

      {status === "idle" && rightSlot && (
        <div className="mt-3 border-t border-border pt-3">{rightSlot}</div>
      )}
    </div>
  );
}
