"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  label: string;
  description?: string;
  children: ReactNode;
  side?: "top" | "bottom";
}

/** Wraps a trigger element; shows label + description on hover/focus.
 *  Used so compact icon-only controls still carry their explanation,
 *  without printing permanent paragraphs on the page. */
export function Tooltip({ label, description, children, side = "bottom" }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-1/2 z-50 w-56 -translate-x-1/2 rounded-lg border border-border bg-paper-raised p-2.5 text-left shadow-raised animate-fade-in",
            side === "bottom" ? "top-full mt-2" : "bottom-full mb-2",
          )}
        >
          <span className="block text-xs font-semibold text-ink">{label}</span>
          {description && (
            <span className="mt-0.5 block text-xs leading-snug text-ink-faint">
              {description}
            </span>
          )}
        </span>
      )}
    </span>
  );
}