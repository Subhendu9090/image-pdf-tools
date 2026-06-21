"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  accent?: "teal" | "amber";
  title: string;
  subtitle: string;
  hint?: string;
}

export function FileDropzone({
  accept,
  multiple = true,
  onFiles,
  accent = "teal",
  title,
  subtitle,
  hint,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      onFiles(Array.from(fileList));
    },
    [onFiles],
  );

  const ringClass =
    accent === "teal"
      ? "border-teal-400 bg-teal-50 dark:bg-teal-900/20"
      : "border-amber-400 bg-amber-50 dark:bg-amber-900/15";
  const iconBg =
    accent === "teal"
      ? "bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-300"
      : "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300";

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={title}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors",
        isDragging ? ringClass : "border-border-strong hover:bg-paper-sunken",
      )}
    >
      <span className={cn("flex h-12 w-12 items-center justify-center rounded-full", iconBg)}>
        <UploadCloud className="h-5 w-5" strokeWidth={2} />
      </span>
      <p className="mt-4 font-display text-base font-semibold text-ink">
        {title}
      </p>
      <p className="mt-1 text-sm text-ink-faint">{subtitle}</p>
      {hint && <p className="mt-3 text-xs text-ink-faint">{hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}