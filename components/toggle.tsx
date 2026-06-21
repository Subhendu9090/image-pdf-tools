"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  accent?: "teal" | "amber";
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  accent = "teal",
}: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && (
          <span className="block text-xs text-ink-faint">{description}</span>
        )}
      </span>
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked
            ? accent === "teal"
              ? "bg-teal-500"
              : "bg-amber-500"
            : "bg-paper-sunken border border-border-strong",
        )}
      >
        <span
          className={cn(
            "inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-[3px]",
          )}
        />
      </span>
    </label>
  );
}