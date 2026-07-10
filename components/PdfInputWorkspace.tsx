"use client";

import { useMemo, useState } from "react";
import { Download, FileText, UploadCloud, X } from "lucide-react";
import { processPdfTool, type PdfActionOptions } from "@/lib/pdf-actions";
import { formatBytes } from "@/lib/utils";

export type PdfWorkspaceData = {
  slug: string;
  title: string;
  description: string;
  accept: string;
  multiple: boolean;
  minFiles?: number;
  actionLabel: string;
  settings?: Array<
    | "pageRanges"
    | "compression"
    | "rotation"
    | "password"
    | "outputFormat"
    | "watermark"
    | "pageNumberPosition"
    | "ocrLanguage"
    | "scanCleanup"
  >;
};

type OutputFile = {
  name: string;
  size: number;
  url: string;
};

export function PdfInputWorkspace({ data }: { data: PdfWorkspaceData }) {
  const [files, setFiles] = useState<File[]>([]);
  const [outputs, setOutputs] = useState<OutputFile[]>([]);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [pageRanges, setPageRanges] = useState("");
  const [compression, setCompression] = useState<"light" | "balanced" | "strong">("balanced");
  const [rotation, setRotation] = useState<"90" | "180" | "270">("90");
  const [password, setPassword] = useState("");
  const [outputFormat, setOutputFormat] = useState<"png" | "jpg">("png");
  const [watermark, setWatermark] = useState("");
  const [pageNumberPosition, setPageNumberPosition] = useState<"bottom-center" | "bottom-right" | "top-right">("bottom-center");
  const [ocrLanguage, setOcrLanguage] = useState<"eng" | "hin" | "spa">("eng");
  const [scanCleanup, setScanCleanup] = useState(true);

  const totalSize = useMemo(
    () => files.reduce((total, file) => total + file.size, 0),
    [files],
  );
  const minFiles = data.minFiles ?? 1;
  const canRun = files.length >= minFiles && !isRunning;
  const hasSettings = (data.settings?.length ?? 0) > 0;
  const firstOutput = outputs[0];

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const nextFiles = Array.from(fileList);
    setFiles((current) => (data.multiple ? [...current, ...nextFiles] : nextFiles.slice(0, 1)));
    setOutputs([]);
    setError("");
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setOutputs([]);
  }

  async function runTool() {
    setIsRunning(true);
    setError("");
    outputs.forEach((output) => URL.revokeObjectURL(output.url));
    setOutputs([]);

    const options: PdfActionOptions = {
      pageRanges,
      compression,
      rotation,
      password,
      outputFormat,
      watermark,
      pageNumberPosition,
      ocrLanguage,
      scanCleanup,
    };

    try {
      const results = await processPdfTool(data.slug, files, options);
      setOutputs(
        results.map((result) => ({
          name: result.fileName,
          size: result.blob.size,
          url: URL.createObjectURL(result.blob),
        })),
      );
    } catch (toolError) {
      setError(toolError instanceof Error ? toolError.message : "Something went wrong.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-paper shadow-soft">
      <div className="border-b border-border bg-paper-raised/60 px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-ink">
              {files.length > 0
                ? `${files.length} selected - ${formatBytes(totalSize)}`
                : `Select ${minFiles}${data.multiple ? "+" : ""} file${minFiles === 1 ? "" : "s"}`}
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              {outputs.length > 0
                ? `${outputs.length} result${outputs.length === 1 ? "" : "s"} ready`
                : data.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <label
              htmlFor={`pdf-upload-${data.slug}`}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-border bg-paper-raised px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-paper-sunken"
            >
              Add files
            </label>
            {firstOutput ? (
              <a
                href={firstOutput.url}
                download={firstOutput.name}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700"
              >
                <Download className="size-4" />
                Download
              </a>
            ) : (
              <button
                type="button"
                onClick={runTool}
                disabled={!canRun}
                className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRunning ? "Processing..." : data.actionLabel}
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        className={`grid gap-4 p-4 sm:p-5 ${
          hasSettings
            ? "xl:grid-cols-[320px_minmax(0,1fr)_280px]"
            : "lg:grid-cols-[340px_minmax(0,1fr)]"
        }`}
      >
        <div className="min-w-0">
          <label
            htmlFor={`pdf-upload-${data.slug}`}
            className="group flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-strong bg-paper-sunken px-4 py-6 text-center transition hover:border-amber-500 hover:bg-paper-raised sm:min-h-52 lg:h-full"
          >
            <span className="flex size-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 transition group-hover:scale-105 dark:bg-amber-900/30 dark:text-amber-300">
              <UploadCloud className="size-6" />
            </span>
            <span className="mt-4 font-display text-base font-semibold text-ink">
              Upload files
            </span>
            <span className="mt-1 max-w-56 text-sm leading-6 text-ink-soft">
              Click here to choose files
            </span>
            <span className="mt-3 rounded-full bg-paper px-3 py-1 text-xs font-medium text-ink-faint">
              {data.multiple ? "Multiple files allowed" : "One file only"}
            </span>
            <input
              id={`pdf-upload-${data.slug}`}
              type="file"
              accept={data.accept}
              multiple={data.multiple}
              className="hidden"
              onChange={(event) => addFiles(event.target.files)}
            />
          </label>

          {error ? (
            <p className="mt-3 rounded-lg bg-danger-soft p-3 text-sm text-danger">{error}</p>
          ) : null}
        </div>

        <div className="min-w-0 rounded-lg border border-border bg-paper-raised p-3 sm:p-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h2 className="font-display text-sm font-semibold text-ink">
                Selected files
              </h2>
              <span className="text-xs text-ink-faint">
                {files.length} file{files.length === 1 ? "" : "s"} - {formatBytes(totalSize)}
              </span>
            </div>

            {files.length === 0 ? (
              <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-paper-sunken p-5 text-center">
                <FileText className="size-6 text-ink-faint" />
                <p className="mt-2 text-sm font-medium text-ink-soft">
                  Your selected files will appear here.
                </p>
                <p className="mt-1 text-xs text-ink-faint">
                  Add files to continue.
                </p>
              </div>
            ) : (
              <ul className="grid gap-2">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-paper-raised px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{file.name}</p>
                      <p className="mt-0.5 text-xs text-ink-faint">{formatBytes(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="shrink-0 rounded-full p-2 text-ink-faint transition hover:bg-paper-sunken hover:text-ink"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {outputs.length > 0 ? (
            <div className="mt-4 rounded-lg border border-border bg-paper p-3">
              <h2 className="font-display text-sm font-semibold text-ink">Results</h2>
              <ul className="mt-3 grid gap-2">
                {outputs.map((output) => (
                  <li
                    key={output.url}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-paper px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{output.name}</p>
                      <p className="mt-0.5 text-xs text-ink-faint">{formatBytes(output.size)}</p>
                    </div>
                    <a
                      href={output.url}
                      download={output.name}
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200"
                    >
                      <Download className="size-4" />
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {hasSettings ? (
          <aside className="rounded-lg border border-border bg-paper-raised p-4 xl:sticky xl:top-24 xl:self-start">
            <h2 className="font-display text-sm font-semibold text-ink">Options</h2>
            <div className="mt-4">
              <ToolSettings
                settings={data.settings ?? []}
                pageRanges={pageRanges}
                setPageRanges={setPageRanges}
                compression={compression}
                setCompression={setCompression}
                rotation={rotation}
                setRotation={setRotation}
                password={password}
                setPassword={setPassword}
                outputFormat={outputFormat}
                setOutputFormat={setOutputFormat}
                watermark={watermark}
                setWatermark={setWatermark}
                pageNumberPosition={pageNumberPosition}
                setPageNumberPosition={setPageNumberPosition}
                ocrLanguage={ocrLanguage}
                setOcrLanguage={setOcrLanguage}
                scanCleanup={scanCleanup}
                setScanCleanup={setScanCleanup}
              />
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

function ToolSettings(props: {
  settings: NonNullable<PdfWorkspaceData["settings"]>;
  pageRanges: string;
  setPageRanges: (value: string) => void;
  compression: "light" | "balanced" | "strong";
  setCompression: (value: "light" | "balanced" | "strong") => void;
  rotation: "90" | "180" | "270";
  setRotation: (value: "90" | "180" | "270") => void;
  password: string;
  setPassword: (value: string) => void;
  outputFormat: "png" | "jpg";
  setOutputFormat: (value: "png" | "jpg") => void;
  watermark: string;
  setWatermark: (value: string) => void;
  pageNumberPosition: "bottom-center" | "bottom-right" | "top-right";
  setPageNumberPosition: (value: "bottom-center" | "bottom-right" | "top-right") => void;
  ocrLanguage: "eng" | "hin" | "spa";
  setOcrLanguage: (value: "eng" | "hin" | "spa") => void;
  scanCleanup: boolean;
  setScanCleanup: (value: boolean) => void;
}) {
  return (
    <div className="grid gap-4">
      {props.settings.includes("pageRanges") ? (
        <label className="grid gap-2 text-sm font-medium text-ink">
          Page ranges
          <input
            value={props.pageRanges}
            onChange={(event) => props.setPageRanges(event.target.value)}
            placeholder="Example: 1-3, 5"
            className="rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink"
          />
        </label>
      ) : null}

      {props.settings.includes("compression") ? (
        <SelectSetting
          label="Compression"
          value={props.compression}
          options={["light", "balanced", "strong"]}
          onChange={props.setCompression}
        />
      ) : null}

      {props.settings.includes("rotation") ? (
        <SelectSetting
          label="Rotation"
          value={props.rotation}
          options={["90", "180", "270"]}
          onChange={props.setRotation}
        />
      ) : null}

      {props.settings.includes("password") ? (
        <label className="grid gap-2 text-sm font-medium text-ink">
          Password
          <input
            type="password"
            value={props.password}
            onChange={(event) => props.setPassword(event.target.value)}
            className="rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink"
          />
        </label>
      ) : null}

      {props.settings.includes("outputFormat") ? (
        <SelectSetting
          label="Output format"
          value={props.outputFormat}
          options={["png", "jpg"]}
          onChange={props.setOutputFormat}
        />
      ) : null}

      {props.settings.includes("watermark") ? (
        <label className="grid gap-2 text-sm font-medium text-ink">
          Watermark text
          <input
            value={props.watermark}
            onChange={(event) => props.setWatermark(event.target.value)}
            className="rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink"
          />
        </label>
      ) : null}

      {props.settings.includes("pageNumberPosition") ? (
        <SelectSetting
          label="Number position"
          value={props.pageNumberPosition}
          options={["bottom-center", "bottom-right", "top-right"]}
          onChange={props.setPageNumberPosition}
        />
      ) : null}

      {props.settings.includes("ocrLanguage") ? (
        <SelectSetting
          label="OCR language"
          value={props.ocrLanguage}
          options={["eng", "hin", "spa"]}
          onChange={props.setOcrLanguage}
        />
      ) : null}

      {props.settings.includes("scanCleanup") ? (
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={props.scanCleanup}
            onChange={(event) => props.setScanCleanup(event.target.checked)}
            className="accent-amber-500"
          />
          Auto-enhance scans
        </label>
      ) : null}
    </div>
  );
}

function SelectSetting<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-ink">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
