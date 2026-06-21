"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  Badge,
  Copy,
  Download,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Info,
  ListOrdered,
  Lock,
  PanelTop,
  PlayCircle,
  RotateCw,
  ScanText,
  ShieldCheck,
  Trash2,
  Unlock,
} from "lucide-react";
import { FileDropzone } from "@/components/file-dropzone";
import { FilePreviewCard, type FileStatus } from "@/components/file-preview-card";
import { SegmentedControl } from "@/components/segment-control";
import { Slider } from "@/components/slider";
import { Toggle } from "@/components/toggle";
import type { Tool } from "@/data/tools";
import { cn, formatBytes } from "@/lib/utils";

type PdfInputKind = "pdf" | "image" | "document" | "spreadsheet" | "presentation";

type PdfToolConfig = {
  accept: string;
  inputKind: PdfInputKind;
  multiple: boolean;
  minFiles?: number;
  actionLabel: string;
  emptyTitle: string;
  emptySubtitle: string;
  outputExt: string;
  settings: Array<
    | "order"
    | "ranges"
    | "compression"
    | "rotate"
    | "password"
    | "unlock"
    | "watermark"
    | "pageNumbers"
    | "ocr"
    | "scan"
    | "exportFormat"
  >;
};

type PdfItem = {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  resultUrl?: string;
  resultBlob?: Blob;
  errorMessage?: string;
};

const CONFIGS: Record<string, PdfToolConfig> = {
  "merge-pdf": {
    accept: "application/pdf",
    inputKind: "pdf",
    multiple: true,
    minFiles: 2,
    actionLabel: "Merge PDF",
    emptyTitle: "Drop PDFs here, or click to browse",
    emptySubtitle: "Add two or more PDFs and arrange them before merging.",
    outputExt: "pdf",
    settings: ["order"],
  },
  "split-pdf": {
    accept: "application/pdf",
    inputKind: "pdf",
    multiple: false,
    actionLabel: "Split PDF",
    emptyTitle: "Drop one PDF here",
    emptySubtitle: "Choose page ranges or split every page into separate files.",
    outputExt: "pdf",
    settings: ["ranges"],
  },
  "compress-pdf": {
    accept: "application/pdf",
    inputKind: "pdf",
    multiple: true,
    actionLabel: "Compress PDF",
    emptyTitle: "Drop PDFs here",
    emptySubtitle: "Pick a compression level before preparing smaller files.",
    outputExt: "pdf",
    settings: ["compression"],
  },
  "pdf-to-image": {
    accept: "application/pdf",
    inputKind: "pdf",
    multiple: false,
    actionLabel: "Convert to Images",
    emptyTitle: "Drop a PDF here",
    emptySubtitle: "Export pages as PNG or JPG images.",
    outputExt: "png",
    settings: ["exportFormat", "ranges"],
  },
  "image-to-pdf": {
    accept: "image/*",
    inputKind: "image",
    multiple: true,
    actionLabel: "Create PDF",
    emptyTitle: "Drop images here",
    emptySubtitle: "Add images, reorder them, and turn them into one PDF.",
    outputExt: "pdf",
    settings: ["order"],
  },
  "pdf-to-word": {
    accept: "application/pdf",
    inputKind: "pdf",
    multiple: false,
    actionLabel: "Convert to Word",
    emptyTitle: "Drop a PDF here",
    emptySubtitle: "Prepare an editable DOCX document from your PDF.",
    outputExt: "docx",
    settings: ["ocr"],
  },
  "word-to-pdf": {
    accept: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    inputKind: "document",
    multiple: true,
    actionLabel: "Convert to PDF",
    emptyTitle: "Drop Word files here",
    emptySubtitle: "Convert DOC or DOCX files into PDF documents.",
    outputExt: "pdf",
    settings: [],
  },
  "pdf-to-excel": {
    accept: "application/pdf",
    inputKind: "pdf",
    multiple: false,
    actionLabel: "Convert to Excel",
    emptyTitle: "Drop a PDF here",
    emptySubtitle: "Extract tables into an editable spreadsheet.",
    outputExt: "xlsx",
    settings: ["ocr"],
  },
  "excel-to-pdf": {
    accept: ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    inputKind: "spreadsheet",
    multiple: true,
    actionLabel: "Convert to PDF",
    emptyTitle: "Drop Excel files here",
    emptySubtitle: "Turn spreadsheets into tidy PDF reports.",
    outputExt: "pdf",
    settings: [],
  },
  "pdf-to-powerpoint": {
    accept: "application/pdf",
    inputKind: "pdf",
    multiple: false,
    actionLabel: "Convert to PowerPoint",
    emptyTitle: "Drop a PDF here",
    emptySubtitle: "Create an editable presentation from PDF pages.",
    outputExt: "pptx",
    settings: ["ranges"],
  },
  "powerpoint-to-pdf": {
    accept: ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
    inputKind: "presentation",
    multiple: true,
    actionLabel: "Convert to PDF",
    emptyTitle: "Drop PowerPoint files here",
    emptySubtitle: "Save decks as easy-to-share PDFs.",
    outputExt: "pdf",
    settings: [],
  },
  "rotate-pdf": {
    accept: "application/pdf",
    inputKind: "pdf",
    multiple: true,
    actionLabel: "Rotate PDF",
    emptyTitle: "Drop PDFs here",
    emptySubtitle: "Rotate pages to the right orientation.",
    outputExt: "pdf",
    settings: ["rotate", "ranges"],
  },
  "unlock-pdf": {
    accept: "application/pdf",
    inputKind: "pdf",
    multiple: true,
    actionLabel: "Unlock PDF",
    emptyTitle: "Drop locked PDFs here",
    emptySubtitle: "Enter the current password for PDFs you can edit.",
    outputExt: "pdf",
    settings: ["unlock"],
  },
  "protect-pdf": {
    accept: "application/pdf",
    inputKind: "pdf",
    multiple: true,
    actionLabel: "Protect PDF",
    emptyTitle: "Drop PDFs here",
    emptySubtitle: "Add password protection before sharing.",
    outputExt: "pdf",
    settings: ["password"],
  },
  "organize-pdf": {
    accept: "application/pdf",
    inputKind: "pdf",
    multiple: false,
    actionLabel: "Organize PDF",
    emptyTitle: "Drop a PDF here",
    emptySubtitle: "Reorder, rotate, or remove pages before exporting.",
    outputExt: "pdf",
    settings: ["order", "rotate"],
  },
  "extract-pdf-pages": {
    accept: "application/pdf",
    inputKind: "pdf",
    multiple: false,
    actionLabel: "Extract Pages",
    emptyTitle: "Drop a PDF here",
    emptySubtitle: "Save selected pages into a new PDF.",
    outputExt: "pdf",
    settings: ["ranges"],
  },
  "delete-pdf-pages": {
    accept: "application/pdf",
    inputKind: "pdf",
    multiple: false,
    actionLabel: "Delete Pages",
    emptyTitle: "Drop a PDF here",
    emptySubtitle: "Choose pages to remove from the final document.",
    outputExt: "pdf",
    settings: ["ranges"],
  },
  "add-page-numbers": {
    accept: "application/pdf",
    inputKind: "pdf",
    multiple: true,
    actionLabel: "Add Page Numbers",
    emptyTitle: "Drop PDFs here",
    emptySubtitle: "Number pages with position and style controls.",
    outputExt: "pdf",
    settings: ["pageNumbers"],
  },
  "add-watermark": {
    accept: "application/pdf",
    inputKind: "pdf",
    multiple: true,
    actionLabel: "Add Watermark",
    emptyTitle: "Drop PDFs here",
    emptySubtitle: "Apply a text watermark across your pages.",
    outputExt: "pdf",
    settings: ["watermark"],
  },
  "pdf-ocr": {
    accept: "application/pdf",
    inputKind: "pdf",
    multiple: true,
    actionLabel: "Run OCR",
    emptyTitle: "Drop scanned PDFs here",
    emptySubtitle: "Make text searchable with OCR settings.",
    outputExt: "pdf",
    settings: ["ocr"],
  },
  "scan-to-pdf": {
    accept: "image/*,application/pdf",
    inputKind: "image",
    multiple: true,
    actionLabel: "Build PDF",
    emptyTitle: "Drop scans or captures here",
    emptySubtitle: "Combine document captures into a clean PDF.",
    outputExt: "pdf",
    settings: ["scan", "order"],
  },
};

const DEFAULT_CONFIG: PdfToolConfig = {
  accept: "application/pdf",
  inputKind: "pdf",
  multiple: true,
  actionLabel: "Process PDF",
  emptyTitle: "Drop files here",
  emptySubtitle: "Add files to prepare this PDF workflow.",
  outputExt: "pdf",
  settings: [],
};

function acceptsFile(file: File, config: PdfToolConfig) {
  if (config.accept.includes("image/*") && file.type.startsWith("image/")) return true;
  if (config.inputKind === "pdf") return file.type === "application/pdf";
  if (config.inputKind === "image") {
    return file.type.startsWith("image/") || file.type === "application/pdf";
  }
  return config.accept
    .split(",")
    .some((part) => {
      const rule = part.trim().toLowerCase();
      return rule.startsWith(".")
        ? file.name.toLowerCase().endsWith(rule)
        : file.type.toLowerCase() === rule;
    });
}

export function PdfInputWorkspace({ tool }: { tool: Tool }) {
  const config = CONFIGS[tool.slug] ?? DEFAULT_CONFIG;
  const [items, setItems] = useState<PdfItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [pageRanges, setPageRanges] = useState("1-3, 5");
  const [splitEachPage, setSplitEachPage] = useState(false);
  const [compression, setCompression] = useState<"light" | "balanced" | "strong">("balanced");
  const [rotation, setRotation] = useState<"90" | "180" | "270">("90");
  const [password, setPassword] = useState("");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [watermark, setWatermark] = useState("Confidential");
  const [pageNumberPosition, setPageNumberPosition] = useState<"bottom-center" | "bottom-right" | "top-right">("bottom-center");
  const [ocrLanguage, setOcrLanguage] = useState<"eng" | "hin" | "spa">("eng");
  const [exportFormat, setExportFormat] = useState<"png" | "jpg">("png");
  const [scanCleanup, setScanCleanup] = useState(true);
  const [quality, setQuality] = useState(82);

  const totalSize = useMemo(() => items.reduce((sum, item) => sum + item.file.size, 0), [items]);
  const doneCount = items.filter((item) => item.status === "done").length;
  const minFiles = config.minFiles ?? 1;
  const missingPassword =
    (tool.slug === "protect-pdf" && password.length < 1) ||
    (tool.slug === "unlock-pdf" && unlockPassword.length < 1);
  const canRun = items.length >= minFiles && !missingPassword && !isProcessing;

  const handleFiles = useCallback(
    (files: File[]) => {
      const accepted = files.filter((file) => acceptsFile(file, config));
      setRejectedCount(files.length - accepted.length);
      const nextItems = accepted.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
        status: "idle" as FileStatus,
        progress: 0,
      }));
      setItems((current) => (config.multiple ? [...current, ...nextItems] : nextItems.slice(0, 1)));
    },
    [config],
  );

  const updateItem = useCallback((id: string, patch: Partial<PdfItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const moveItem = useCallback((id: string, direction: -1 | 1) => {
    setItems((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const runTool = useCallback(async () => {
    setIsProcessing(true);
    for (const item of items) {
      updateItem(item.id, { status: "processing", progress: 35 });
      await new Promise((resolve) => setTimeout(resolve, 220));
      updateItem(item.id, { progress: 75 });
      await new Promise((resolve) => setTimeout(resolve, 260));
      try {
        const resultBlob = item.file;
        updateItem(item.id, {
          status: "done",
          progress: 100,
          resultBlob,
          resultUrl: URL.createObjectURL(resultBlob),
        });
      } catch (error) {
        updateItem(item.id, {
          status: "error",
          progress: 0,
          errorMessage: error instanceof Error ? error.message : "Processing failed",
        });
      }
    }
    setIsProcessing(false);
  }, [items, updateItem]);

  const downloadItem = useCallback(
    (item: PdfItem) => {
      if (!item.resultUrl) return;
      const baseName = item.file.name.replace(/\.[^/.]+$/, "");
      const link = document.createElement("a");
      link.href = item.resultUrl;
      link.download = `${baseName}-${tool.slug.replace(/-pdf$/, "")}.${tool.slug === "pdf-to-image" ? exportFormat : config.outputExt}`;
      link.click();
    },
    [config.outputExt, exportFormat, tool.slug],
  );

  return (
    <div className="rounded-lg border border-border bg-paper p-4 shadow-soft sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-300">
            PDF input
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">
            {tool.title} workspace
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink-soft">
            Configure files for this tool. Processing is staged in-browser and
            ready for the real PDF engine.
          </p>
        </div>
        <span className="hidden rounded-md bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-200 sm:inline-flex">
          {tool.formats.join(" / ")}
        </span>
      </div>

      {items.length === 0 ? (
        <FileDropzone
          accept={config.accept}
          multiple={config.multiple}
          onFiles={handleFiles}
          accent="amber"
          title={config.emptyTitle}
          subtitle={config.emptySubtitle}
          hint="Files stay in your browser. Nothing uploads to a server."
        />
      ) : (
        <div className="space-y-4">
          {config.multiple && (
            <button
              type="button"
              onClick={() => document.getElementById(`pdf-input-${tool.slug}`)?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border-strong bg-paper-raised px-4 py-3 text-sm font-medium text-ink-soft transition-colors hover:bg-paper-sunken"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Add more files
              <input
                id={`pdf-input-${tool.slug}`}
                type="file"
                accept={config.accept}
                multiple={config.multiple}
                className="hidden"
                onChange={(event) => handleFiles(Array.from(event.target.files ?? []))}
              />
            </button>
          )}

          <SettingsPanel
            settings={config.settings}
            pageRanges={pageRanges}
            setPageRanges={setPageRanges}
            splitEachPage={splitEachPage}
            setSplitEachPage={setSplitEachPage}
            compression={compression}
            setCompression={setCompression}
            rotation={rotation}
            setRotation={setRotation}
            password={password}
            setPassword={setPassword}
            unlockPassword={unlockPassword}
            setUnlockPassword={setUnlockPassword}
            watermark={watermark}
            setWatermark={setWatermark}
            pageNumberPosition={pageNumberPosition}
            setPageNumberPosition={setPageNumberPosition}
            ocrLanguage={ocrLanguage}
            setOcrLanguage={setOcrLanguage}
            exportFormat={exportFormat}
            setExportFormat={setExportFormat}
            scanCleanup={scanCleanup}
            setScanCleanup={setScanCleanup}
            quality={quality}
            setQuality={setQuality}
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runTool}
              disabled={!canRun}
              className={cn(
                "flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-opacity hover:opacity-90",
                !canRun && "opacity-50",
              )}
            >
              <PlayCircle className="h-4 w-4" />
              {isProcessing ? "Processing..." : config.actionLabel}
            </button>
            {doneCount > 0 && (
              <button
                type="button"
                onClick={() => items.forEach((item) => item.status === "done" && downloadItem(item))}
                className="flex items-center gap-2 rounded-full border border-border-strong bg-paper-raised px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper-sunken"
              >
                <Download className="h-4 w-4" />
                Download all ({doneCount})
              </button>
            )}
            <button
              type="button"
              onClick={() => setItems([])}
              className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-ink-faint transition-colors hover:bg-paper-sunken hover:text-ink"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          </div>

          {items.length < minFiles && (
            <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <Info className="h-3.5 w-3.5" />
              Add {minFiles - items.length} more file{minFiles - items.length === 1 ? "" : "s"} to continue.
            </p>
          )}
          {missingPassword && (
            <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <Info className="h-3.5 w-3.5" />
              Enter the required password before running this tool.
            </p>
          )}
        </div>
      )}

      {rejectedCount > 0 && (
        <p className="mt-3 text-xs text-danger">
          {rejectedCount} file{rejectedCount === 1 ? "" : "s"} skipped because the format is not supported here.
        </p>
      )}

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-ink">
            {items.length === 0
              ? "Selected files"
              : `${items.length} file${items.length === 1 ? "" : "s"} · ${formatBytes(totalSize)}`}
          </h3>
        </div>
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-paper-sunken p-8 text-center">
            <FileText className="mx-auto h-6 w-6 text-ink-faint" />
            <p className="mt-2 text-sm text-ink-faint">
              Your PDF input queue will appear here.
            </p>
          </div>
        ) : (
          <div className="scroll-thin flex max-h-[360px] flex-col gap-3 overflow-y-auto pr-1">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-start gap-2">
                {config.settings.includes("order") && items.length > 1 && (
                  <div className="mt-3 flex flex-col gap-1 text-ink-faint">
                    <button
                      type="button"
                      onClick={() => moveItem(item.id, -1)}
                      disabled={index === 0}
                      className="rounded p-0.5 hover:bg-paper-sunken disabled:opacity-30"
                      aria-label="Move file up"
                    >
                      <GripVertical className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(item.id, 1)}
                      disabled={index === items.length - 1}
                      className="rounded p-0.5 hover:bg-paper-sunken disabled:opacity-30"
                      aria-label="Move file down"
                    >
                      <GripVertical className="h-3.5 w-3.5 rotate-180" />
                    </button>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <FilePreviewCard
                    name={item.file.name}
                    sizeBytes={item.file.size}
                    resultSizeBytes={item.resultBlob?.size}
                    previewUrl={item.file.type.startsWith("image/") ? URL.createObjectURL(item.file) : undefined}
                    kind={item.file.type.startsWith("image/") ? "image" : "pdf"}
                    status={item.status}
                    progress={item.progress}
                    accent="amber"
                    onRemove={() => setItems((current) => current.filter((next) => next.id !== item.id))}
                    errorMessage={item.errorMessage}
                    rightSlot={
                      item.status === "done" ? (
                        <button
                          type="button"
                          onClick={() => downloadItem(item)}
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
  );
}

function SettingsPanel(props: {
  settings: PdfToolConfig["settings"];
  pageRanges: string;
  setPageRanges: (value: string) => void;
  splitEachPage: boolean;
  setSplitEachPage: (value: boolean) => void;
  compression: "light" | "balanced" | "strong";
  setCompression: (value: "light" | "balanced" | "strong") => void;
  rotation: "90" | "180" | "270";
  setRotation: (value: "90" | "180" | "270") => void;
  password: string;
  setPassword: (value: string) => void;
  unlockPassword: string;
  setUnlockPassword: (value: string) => void;
  watermark: string;
  setWatermark: (value: string) => void;
  pageNumberPosition: "bottom-center" | "bottom-right" | "top-right";
  setPageNumberPosition: (value: "bottom-center" | "bottom-right" | "top-right") => void;
  ocrLanguage: "eng" | "hin" | "spa";
  setOcrLanguage: (value: "eng" | "hin" | "spa") => void;
  exportFormat: "png" | "jpg";
  setExportFormat: (value: "png" | "jpg") => void;
  scanCleanup: boolean;
  setScanCleanup: (value: boolean) => void;
  quality: number;
  setQuality: (value: number) => void;
}) {
  if (props.settings.length === 0) {
    return (
      <section className="rounded-lg border border-border bg-paper-raised p-4">
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <Info className="h-4 w-4 text-amber-500" />
          This tool is ready to run with the selected files.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-border bg-paper-raised p-4">
      <h3 className="font-display text-base font-semibold text-ink">
        Tool settings
      </h3>

      {props.settings.includes("order") && (
        <SettingRow icon={PanelTop} title="File order">
          <p className="text-sm text-ink-faint">
            Files process in the order shown below. Use the handles to adjust
            the sequence.
          </p>
        </SettingRow>
      )}

      {props.settings.includes("ranges") && (
        <SettingRow icon={Copy} title="Page selection">
          <Toggle
            checked={props.splitEachPage}
            onChange={props.setSplitEachPage}
            accent="amber"
            label="Split every page"
            description="Turn this off to use a page range."
          />
          {!props.splitEachPage && (
            <input
              type="text"
              value={props.pageRanges}
              onChange={(event) => props.setPageRanges(event.target.value)}
              className="mt-3 w-full rounded-md border border-border bg-paper px-3 py-2 text-sm text-ink"
              placeholder="1-3, 5, 8-10"
            />
          )}
        </SettingRow>
      )}

      {props.settings.includes("compression") && (
        <SettingRow icon={ShieldCheck} title="Compression">
          <SegmentedControl
            options={[
              { value: "light", label: "Light" },
              { value: "balanced", label: "Balanced" },
              { value: "strong", label: "Strong" },
            ]}
            value={props.compression}
            onChange={props.setCompression}
            accent="amber"
          />
        </SettingRow>
      )}

      {props.settings.includes("rotate") && (
        <SettingRow icon={RotateCw} title="Rotation">
          <SegmentedControl
            options={[
              { value: "90", label: "90 deg" },
              { value: "180", label: "180 deg" },
              { value: "270", label: "270 deg" },
            ]}
            value={props.rotation}
            onChange={props.setRotation}
            accent="amber"
          />
        </SettingRow>
      )}

      {props.settings.includes("password") && (
        <SettingRow icon={Lock} title="Password">
          <input
            type="password"
            value={props.password}
            onChange={(event) => props.setPassword(event.target.value)}
            className="w-full rounded-md border border-border bg-paper px-3 py-2 text-sm text-ink"
            placeholder="Choose a password"
          />
        </SettingRow>
      )}

      {props.settings.includes("unlock") && (
        <SettingRow icon={Unlock} title="Current password">
          <input
            type="password"
            value={props.unlockPassword}
            onChange={(event) => props.setUnlockPassword(event.target.value)}
            className="w-full rounded-md border border-border bg-paper px-3 py-2 text-sm text-ink"
            placeholder="Enter the PDF password"
          />
        </SettingRow>
      )}

      {props.settings.includes("watermark") && (
        <SettingRow icon={Badge} title="Watermark text">
          <input
            type="text"
            value={props.watermark}
            onChange={(event) => props.setWatermark(event.target.value)}
            className="w-full rounded-md border border-border bg-paper px-3 py-2 text-sm text-ink"
            placeholder="Watermark text"
          />
          <Slider
            id="watermark-opacity"
            label="Opacity"
            value={props.quality}
            min={20}
            max={100}
            onChange={props.setQuality}
            valueLabel={`${props.quality}%`}
            accent="amber"
          />
        </SettingRow>
      )}

      {props.settings.includes("pageNumbers") && (
        <SettingRow icon={ListOrdered} title="Page number position">
          <SegmentedControl
            options={[
              { value: "bottom-center", label: "Bottom center" },
              { value: "bottom-right", label: "Bottom right" },
              { value: "top-right", label: "Top right" },
            ]}
            value={props.pageNumberPosition}
            onChange={props.setPageNumberPosition}
            accent="amber"
          />
        </SettingRow>
      )}

      {props.settings.includes("ocr") && (
        <SettingRow icon={ScanText} title="OCR language">
          <SegmentedControl
            options={[
              { value: "eng", label: "English" },
              { value: "hin", label: "Hindi" },
              { value: "spa", label: "Spanish" },
            ]}
            value={props.ocrLanguage}
            onChange={props.setOcrLanguage}
            accent="amber"
          />
        </SettingRow>
      )}

      {props.settings.includes("exportFormat") && (
        <SettingRow icon={ImageIcon} title="Image output">
          <SegmentedControl
            options={[
              { value: "png", label: "PNG" },
              { value: "jpg", label: "JPG" },
            ]}
            value={props.exportFormat}
            onChange={props.setExportFormat}
            accent="amber"
          />
        </SettingRow>
      )}

      {props.settings.includes("scan") && (
        <SettingRow icon={ScanText} title="Scan cleanup">
          <Toggle
            checked={props.scanCleanup}
            onChange={props.setScanCleanup}
            accent="amber"
            label="Auto-enhance scanned pages"
            description="Straighten and improve contrast before creating the PDF."
          />
        </SettingRow>
      )}
    </section>
  );
}

function SettingRow({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileText;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0 sm:grid-cols-[180px_1fr]">
      <div className="flex items-center gap-2 text-sm font-medium text-ink">
        <Icon className="h-4 w-4 text-amber-500" />
        {title}
      </div>
      <div className="min-w-0 space-y-3">{children}</div>
    </div>
  );
}
