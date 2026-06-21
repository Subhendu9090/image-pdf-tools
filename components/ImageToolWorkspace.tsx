"use client";

import { ImageIcon, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type PreviewFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
};

const imageActions = [
  "Convert to JPG",
  "Convert to PNG",
  "Convert to WebP",
  "Compress Image",
  "Resize Image",
  "Crop Image",
  "Rotate Image",
  "Flip Image",
  "Remove Background",
  "Extract Text OCR",
  "Convert to PDF",
];

export default function ImageToolWorkspace() {
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [action, setAction] = useState(imageActions[0]);
  const [quality, setQuality] = useState(80);
  const [message, setMessage] = useState("");

  const totalSize = useMemo(() => {
    return files.reduce((sum, file) => sum + file.size, 0);
  }, [files]);

  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.url));
    };
  }, [files]);

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;

    const selectedFiles = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/"),
    );
    const remainingSlots = 10 - files.length;
    const nextFiles = selectedFiles.slice(0, remainingSlots).map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
    }));

    setFiles((currentFiles) => [...currentFiles, ...nextFiles]);

    if (selectedFiles.length > remainingSlots) {
      setMessage("Bulk upload limit is 10 images.");
      return;
    }

    setMessage(nextFiles.length ? "" : "Please select image files only.");
  }

  function removeFile(id: string) {
    setFiles((currentFiles) => {
      const fileToRemove = currentFiles.find((file) => file.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.url);
      }

      return currentFiles.filter((file) => file.id !== id);
    });
  }

  function handleAction() {
    // Image conversion, compression, resize, OCR, or PDF logic will be added here.
    setMessage(`${action} is ready for backend logic. Quality: ${quality}%.`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
        <label
          htmlFor="image-upload"
          className="flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-200 bg-cyan-50/70 px-6 py-12 text-center transition hover:border-cyan-400 hover:bg-cyan-50 dark:border-cyan-900 dark:bg-cyan-950/20 dark:hover:border-cyan-700"
        >
          <UploadCloud className="size-12 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
          <span className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">
            Upload images
          </span>
          <span className="mt-2 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
            Select JPG, PNG, WebP, SVG, HEIC, or any image format. Bulk upload supports up to 10 images.
          </span>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            What do you need?
            <select
              value={action}
              onChange={(event) => setAction(event.target.value)}
              className="h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-cyan-950"
            >
              {imageActions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            Quality: {quality}%
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(event) => setQuality(Number(event.target.value))}
              className="h-12 accent-cyan-600"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={handleAction}
          className="mt-5 w-full rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:scale-[1.01] hover:from-cyan-500 hover:to-blue-500"
        >
          Start Image Process
        </button>

        {message ? (
          <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-200">
            {message}
          </p>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              Image preview
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {files.length}/10 images selected · {formatSize(totalSize)}
            </p>
          </div>
        </div>

        {files.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {files.map((file) => (
              <article
                key={file.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="relative aspect-video bg-slate-200 dark:bg-slate-800">
                  <Image
                    src={file.url}
                    alt={`${file.name} preview`}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, 320px"
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white dark:bg-slate-950/90 dark:text-slate-200"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                    {file.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {formatSize(file.size)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center dark:border-slate-700 dark:bg-slate-950/60">
            <ImageIcon className="size-12 text-slate-400" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
              No image selected
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
              Upload images to see real previews here before choosing conversion quality.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatSize(size: number) {
  if (!size) return "0 KB";
  const sizeInMb = size / 1024 / 1024;

  if (sizeInMb >= 1) {
    return `${sizeInMb.toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}
