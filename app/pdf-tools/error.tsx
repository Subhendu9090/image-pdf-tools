"use client";

import { useEffect } from "react";

export default function PdfToolsError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">
          PDF tool error
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink">
          This PDF tool could not load.
        </h1>
        <p className="mt-4 text-sm leading-6 text-ink-soft">
          Try again, or open the PDF tools directory and choose another tool.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="mt-8 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </section>
  );
}
