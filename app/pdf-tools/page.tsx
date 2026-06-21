"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Combine,
  Scissors,
  Gauge,
  RotateCw,
  Lock,
  Unlock,
  FileOutput,
  Image as ImageIcon,
  FileText,
  Download,
  PlayCircle,
  Trash2,
  GripVertical,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";
import { FileDropzone } from "@/components/file-dropzone";
import { FilePreviewCard, type FileStatus } from "@/components/file-preview-card";
import { SegmentedControl } from "@/components/segment-control";
import { Slider } from "@/components/slider";
import { Toggle } from "@/components/toggle";
import { formatBytes, cn } from "@/lib/utils";

type PdfOperation =
  | "merge"
  | "split"
  | "compress"
  | "rotate"
  | "protect"
  | "unlock"
  | "convert"
  | "export";

interface PdfItem {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  pageCount?: number;
  resultBlob?: Blob;
  resultUrl?: string;
  errorMessage?: string;
}

const OPERATIONS: {
  value: PdfOperation;
  label: string;
  icon: typeof Combine;
  description: string;
  multiple: boolean;
  accept: string;
}[] = [
  {
    value: "merge",
    label: "Merge",
    icon: Combine,
    description: "Combine several PDFs into one, in the order you set.",
    multiple: true,
    accept: "application/pdf",
  },
  {
    value: "split",
    label: "Split & extract",
    icon: Scissors,
    description: "Pull specific pages or ranges out of a PDF.",
    multiple: false,
    accept: "application/pdf",
  },
  {
    value: "compress",
    label: "Compress",
    icon: Gauge,
    description: "Reduce file size for emailing or uploading.",
    multiple: true,
    accept: "application/pdf",
  },
  {
    value: "rotate",
    label: "Rotate",
    icon: RotateCw,
    description: "Fix sideways or upside-down scanned pages.",
    multiple: true,
    accept: "application/pdf",
  },
  {
    value: "protect",
    label: "Protect",
    icon: Lock,
    description: "Add a password before you send a PDF out.",
    multiple: true,
    accept: "application/pdf",
  },
  {
    value: "unlock",
    label: "Remove password",
    icon: Unlock,
    description: "Remove a password from a PDF you own.",
    multiple: true,
    accept: "application/pdf",
  },
  {
    value: "convert",
    label: "Convert to PDF",
    icon: FileOutput,
    description: "Turn images into a single PDF document.",
    multiple: true,
    accept: "image/*",
  },
  {
    value: "export",
    label: "PDF to images",
    icon: ImageIcon,
    description: "Save each page of a PDF as a JPG or PNG.",
    multiple: false,
    accept: "application/pdf",
  },
];

export default function PdfToolsPage() {
  const [operation, setOperation] = useState<PdfOperation>("merge");
  const [items, setItems] = useState<PdfItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Operation-specific settings
  const [pageRanges, setPageRanges] = useState("1-3, 5");
  const [splitEachPage, setSplitEachPage] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState<"light" | "balanced" | "strong">("balanced");
  const [rotateDegrees, setRotateDegrees] = useState<90 | 180 | 270>(90);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [exportFormat, setExportFormat] = useState<"jpeg" | "png">("png");

  const currentOp = OPERATIONS.find((o) => o.value === operation)!;

  const handleFiles = useCallback((files: File[]) => {
    const accepted = files.filter((f) =>
      currentOp.accept === "image/*"
        ? f.type.startsWith("image/")
        : f.type === "application/pdf",
    );
    const newItems: PdfItem[] = accepted.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
      file,
      status: "idle",
      progress: 0,
      pageCount: file.type === "application/pdf" ? undefined : undefined,
    }));
    setItems((prev) => (currentOp.multiple ? [...prev, ...newItems] : newItems));
  }, [currentOp]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clearAll = useCallback(() => setItems([]), []);

  const moveItem = useCallback((id: string, direction: -1 | 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((it) => it.id === id);
      const target = idx + direction;
      if (idx === -1 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<PdfItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const switchOperation = useCallback((next: PdfOperation) => {
    setOperation(next);
    setItems([]);
  }, []);

  const passwordsMismatch =
    operation === "protect" && password.length > 0 && password !== confirmPassword;

  const canRun = useMemo(() => {
    if (items.length === 0) return false;
    if (operation === "merge" && items.length < 2) return false;
    if (operation === "protect" && (!password || passwordsMismatch)) return false;
    if (operation === "unlock" && !unlockPassword) return false;
    return true;
  }, [items, operation, password, passwordsMismatch, unlockPassword]);

  // Simulated client-side processing pipeline. In a real build this is
  // where pdf-lib (merge/split/rotate/protect) and pdf.js (export/rasterize)
  // would do the actual work, in-browser, file by file.
  const runOperation = useCallback(async () => {
    setIsProcessing(true);

    if (operation === "merge") {
      // Merge produces a single combined output.
      for (const item of items) updateItem(item.id, { status: "processing", progress: 50 });
      await new Promise((r) => setTimeout(r, 700));
      const combinedBlob = new Blob(
        await Promise.all(items.map((i) => i.file.arrayBuffer())),
        { type: "application/pdf" },
      );
      const resultUrl = URL.createObjectURL(combinedBlob);
      items.forEach((item) =>
        updateItem(item.id, { status: "done", progress: 100, resultBlob: combinedBlob, resultUrl }),
      );
      setIsProcessing(false);
      return;
    }

    for (const item of items) {
      updateItem(item.id, { status: "processing", progress: 20 });
      await new Promise((r) => setTimeout(r, 250));
      updateItem(item.id, { progress: 65 });
      await new Promise((r) => setTimeout(r, 300));
      try {
        const resultBlob = item.file; // placeholder passthrough for the real transform
        const resultUrl = URL.createObjectURL(resultBlob);
        updateItem(item.id, { status: "done", progress: 100, resultBlob, resultUrl });
      } catch (err) {
        updateItem(item.id, {
          status: "error",
          progress: 0,
          errorMessage: err instanceof Error ? err.message : "Processing failed",
        });
      }
    }
    setIsProcessing(false);
  }, [items, operation, updateItem]);

  const downloadOne = useCallback((item: PdfItem) => {
    if (!item.resultUrl) return;
    const baseName = item.file.name.replace(/\.[^/.]+$/, "");
    const suffix =
      operation === "merge"
        ? "merged"
        : operation === "split"
          ? "split"
          : operation === "compress"
            ? "compressed"
            : operation === "rotate"
              ? "rotated"
              : operation === "protect"
                ? "protected"
                : operation === "unlock"
                  ? "unlocked"
                  : "converted";
    const ext = operation === "convert" ? "pdf" : operation === "export" ? exportFormat : "pdf";
    const a = document.createElement("a");
    a.href = item.resultUrl;
    a.download = operation === "merge" ? `merged.pdf` : `${baseName}-${suffix}.${ext}`;
    a.click();
  }, [operation, exportFormat]);

  const downloadAll = useCallback(() => {
    if (operation === "merge") {
      const first = items.find((i) => i.status === "done");
      if (first) downloadOne(first);
      return;
    }
    items.forEach((item) => item.status === "done" && downloadOne(item));
  }, [items, operation, downloadOne]);

  const doneCount = items.filter((i) => i.status === "done").length;
  const totalSize = useMemo(() => items.reduce((s, i) => s + i.file.size, 0), [items]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
          <FileText className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            PDF tools
          </h1>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">
            Merge, split, compress, rotate, lock, or convert PDFs — pick a
            tool below and everything happens on this one page.
          </p>
        </div>
      </div>

      {/* Operation switcher */}
      <div
        role="tablist"
        aria-label="PDF operations"
        className="mb-6 flex flex-wrap gap-2"
      >
        {OPERATIONS.map((op) => {
          const active = op.value === operation;
          return (
            <button
              key={op.value}
              id={op.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => switchOperation(op.value)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-amber-500 bg-amber-500 text-white shadow-soft"
                  : "border-border bg-paper-raised text-ink-soft hover:bg-paper-sunken",
              )}
            >
              <op.icon className="h-3.5 w-3.5" strokeWidth={2} />
              {op.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* LEFT: controls */}
        <div className="space-y-6">
          {items.length === 0 ? (
            <FileDropzone
              accept={currentOp.accept}
              multiple={currentOp.multiple}
              onFiles={handleFiles}
              accent="amber"
              title={
                operation === "convert"
                  ? "Drop images here, or click to browse"
                  : "Drop a PDF here, or click to browse"
              }
              subtitle={currentOp.description}
              hint="Files stay in your browser. Nothing uploads to a server."
            />
          ) : (
            currentOp.multiple && (
              <button
                type="button"
                onClick={() => document.getElementById("add-more-pdf")?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-paper-raised px-4 py-3 text-sm font-medium text-ink-soft transition-colors hover:bg-paper-sunken"
              >
                <currentOp.icon className="h-4 w-4" />
                Add more files
                <input
                  id="add-more-pdf"
                  type="file"
                  accept={currentOp.accept}
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(Array.from(e.target.files ?? []))}
                />
              </button>
            )
          )}

          {items.length > 0 && (
            <>
              {/* Operation-specific settings panel */}
              <section className="rounded-xl border border-border bg-paper-raised p-5 shadow-soft">
                <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
                  <currentOp.icon className="h-4 w-4 text-amber-500" />
                  {currentOp.label} settings
                </h2>

                {operation === "merge" && (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm text-ink-faint">
                      Files combine in the order shown in the list on the
                      right. Use the arrows there to reorder.
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-ink-faint">
                      <Info className="h-3.5 w-3.5" />
                      Add at least 2 PDFs to merge.
                    </p>
                  </div>
                )}

                {operation === "split" && (
                  <div className="mt-3 space-y-4">
                    <Toggle
                      checked={splitEachPage}
                      onChange={setSplitEachPage}
                      accent="amber"
                      label="Split into one PDF per page"
                      description="Turn off to extract a specific page range instead"
                    />
                    {!splitEachPage && (
                      <label className="block">
                        <span className="mb-1 block text-sm font-medium text-ink">
                          Pages to extract
                        </span>
                        <input
                          type="text"
                          value={pageRanges}
                          onChange={(e) => setPageRanges(e.target.value)}
                          placeholder="e.g. 1-3, 5, 8-10"
                          className="w-full rounded-md border border-border bg-paper px-3 py-2 text-sm text-ink"
                        />
                        <span className="mt-1 block text-xs text-ink-faint">
                          Separate pages or ranges with commas.
                        </span>
                      </label>
                    )}
                  </div>
                )}

                {operation === "compress" && (
                  <div className="mt-3 space-y-3">
                    <SegmentedControl
                      options={[
                        { value: "light", label: "Light" },
                        { value: "balanced", label: "Balanced" },
                        { value: "strong", label: "Strong" },
                      ]}
                      value={compressionLevel}
                      onChange={setCompressionLevel}
                      accent="amber"
                    />
                    <p className="text-xs text-ink-faint">
                      {compressionLevel === "light" &&
                        "Smallest reduction, best for keeping image quality intact."}
                      {compressionLevel === "balanced" &&
                        "Good size savings for everyday sharing — our default."}
                      {compressionLevel === "strong" &&
                        "Maximum size reduction. Images inside the PDF may look softer."}
                    </p>
                  </div>
                )}

                {operation === "rotate" && (
                  <div className="mt-3 space-y-3">
                    <span className="block text-sm font-medium text-ink">
                      Rotate every page by
                    </span>
                    <SegmentedControl
                      options={[
                        { value: "90", label: "90°" },
                        { value: "180", label: "180°" },
                        { value: "270", label: "270°" },
                      ]}
                      value={String(rotateDegrees)}
                      onChange={(v:any) => setRotateDegrees(Number(v) as 90 | 180 | 270)}
                      accent="amber"
                    />
                  </div>
                )}

                {operation === "protect" && (
                  <div className="mt-3 space-y-4">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-ink">
                        Password
                      </span>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-md border border-border bg-paper px-3 py-2 pr-10 text-sm text-ink"
                          placeholder="Choose a password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-ink">
                        Confirm password
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={cn(
                          "w-full rounded-md border bg-paper px-3 py-2 text-sm text-ink",
                          passwordsMismatch ? "border-danger" : "border-border",
                        )}
                        placeholder="Re-enter the password"
                      />
                      {passwordsMismatch && (
                        <span className="mt-1 block text-xs text-danger">
                          Passwords don&apos;t match.
                        </span>
                      )}
                    </label>
                  </div>
                )}

                {operation === "unlock" && (
                  <div className="mt-3">
                    <label className="block">
                      <span className="mb-1 block text-sm font-medium text-ink">
                        Current password
                      </span>
                      <input
                        type="password"
                        value={unlockPassword}
                        onChange={(e) => setUnlockPassword(e.target.value)}
                        className="w-full rounded-md border border-border bg-paper px-3 py-2 text-sm text-ink"
                        placeholder="Enter the PDF's password"
                      />
                    </label>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
                      <Info className="h-3.5 w-3.5" />
                      Only use this on PDFs you own or have permission to
                      unlock.
                    </p>
                  </div>
                )}

                {operation === "convert" && (
                  <p className="mt-3 text-sm text-ink-faint">
                    Each image becomes one page, in the order shown on the
                    right. Reorder them there before converting.
                  </p>
                )}

                {operation === "export" && (
                  <div className="mt-3 space-y-3">
                    <span className="block text-sm font-medium text-ink">
                      Save pages as
                    </span>
                    <SegmentedControl
                      options={[
                        { value: "png", label: "PNG" },
                        { value: "jpeg", label: "JPG" },
                      ]}
                      value={exportFormat}
                      onChange={setExportFormat}
                      accent="amber"
                    />
                  </div>
                )}
              </section>

              {/* Action bar */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={runOperation}
                  disabled={!canRun || isProcessing}
                  className={cn(
                    "flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-opacity hover:opacity-90",
                    (!canRun || isProcessing) && "opacity-50",
                  )}
                >
                  <PlayCircle className="h-4 w-4" />
                  {isProcessing ? "Processing…" : `Run ${currentOp.label.toLowerCase()}`}
                </button>

                {doneCount > 0 && (
                  <button
                    type="button"
                    onClick={downloadAll}
                    className="flex items-center gap-2 rounded-full border border-border-strong bg-paper-raised px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper-sunken"
                  >
                    <Download className="h-4 w-4" />
                    {operation === "merge" ? "Download merged PDF" : `Download all (${doneCount})`}
                  </button>
                )}

                <button
                  type="button"
                  onClick={clearAll}
                  className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-ink-faint transition-colors hover:bg-paper-sunken hover:text-ink"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear all
                </button>
              </div>

              {operation === "merge" && items.length < 2 && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <Info className="h-3.5 w-3.5" />
                  Add one more PDF to enable merging.
                </p>
              )}
            </>
          )}
        </div>

        {/* RIGHT: file list */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-ink">
              {items.length === 0
                ? "Files"
                : `${items.length} file${items.length === 1 ? "" : "s"}${totalSize ? ` · ${formatBytes(totalSize)}` : ""}`}
            </h2>
          </div>

          {items.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-border bg-paper-sunken p-8 text-center">
              <FileText className="mx-auto h-6 w-6 text-ink-faint" />
              <p className="mt-2 text-sm text-ink-faint">
                Uploaded files will appear here.
              </p>
            </div>
          ) : (
            <div className="scroll-thin mt-3 flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-start gap-2">
                  {(operation === "merge" || operation === "convert") && items.length > 1 && (
                    <div className="mt-3 flex flex-col gap-0.5 text-ink-faint">
                      <button
                        type="button"
                        onClick={() => moveItem(item.id, -1)}
                        disabled={idx === 0}
                        aria-label="Move up"
                        className="rounded p-0.5 hover:bg-paper-sunken disabled:opacity-30"
                      >
                        <GripVertical className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  <div className="flex-1">
                    <FilePreviewCard
                      name={item.file.name}
                      sizeBytes={item.file.size}
                      resultSizeBytes={item.resultBlob?.size}
                      previewUrl={
                        item.file.type.startsWith("image/")
                          ? URL.createObjectURL(item.file)
                          : undefined
                      }
                      kind={item.file.type.startsWith("image/") ? "image" : "pdf"}
                      status={item.status}
                      progress={item.progress}
                      accent="amber"
                      onRemove={() => removeItem(item.id)}
                      errorMessage={item.errorMessage}
                      rightSlot={
                        item.status === "done" ? (
                          <button
                            type="button"
                            onClick={() => downloadOne(item)}
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300"
                            aria-label={`Download ${item.file.name}`}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        ) : undefined
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}