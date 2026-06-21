"use client";

import { UploadCloud } from "lucide-react";
import { useState } from "react";

type UploadBoxProps = {
  title: string;
  formats: string[];
};

export default function UploadBox({ title, formats }: UploadBoxProps) {
  const [fileNames, setFileNames] = useState<string[]>([]);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    setFileNames(Array.from(files).map((file) => file.name));
  }

  function handleAction() {
    // Conversion logic will be added here.
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20">
      <label
        htmlFor="file-upload"
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-cyan-200 bg-cyan-50/60 px-6 py-12 text-center transition hover:border-cyan-400 hover:bg-cyan-50 dark:border-cyan-900 dark:bg-cyan-950/20 dark:hover:border-cyan-700"
      >
        <UploadCloud className="size-12 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
        <span className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
          Drop files here or browse
        </span>
        <span className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Supported formats: {formats.join(", ")}
        </span>
        <input
          id="file-upload"
          type="file"
          multiple
          className="sr-only"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </label>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
        <h2 className="text-sm font-semibold text-slate-950 dark:text-white">
          File preview
        </h2>
        {fileNames.length ? (
          <ul className="mt-3 grid gap-2">
            {fileNames.map((fileName) => (
              <li
                key={fileName}
                className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm dark:bg-slate-900 dark:text-slate-200"
              >
                {fileName}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No files selected yet. Your preview will appear here.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleAction}
        className="mt-5 w-full rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:scale-[1.01] hover:from-cyan-500 hover:to-blue-500"
      >
        Start {title}
      </button>
    </div>
  );
}
