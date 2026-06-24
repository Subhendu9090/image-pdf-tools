"use client";

import { Image as ImageIcon } from "lucide-react";

export function AddMoreImages({
  inputId,
  onFiles,
}: {
  inputId: string;
  onFiles: (files: File[]) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => document.getElementById(inputId)?.click()}
      className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-paper-raised px-4 mt-20 text-sm font-medium text-ink-soft transition-colors hover:bg-paper-sunken py-8"
    >
      <ImageIcon className="h-6 w-6" />
      Add more images
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onFiles(Array.from(e.target.files ?? []))}
      />
    </button>
  );
}