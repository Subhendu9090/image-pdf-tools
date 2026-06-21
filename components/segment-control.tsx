"use client";

import { cn } from "@/lib/utils";

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accent?: "teal" | "amber";
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accent = "teal",
  size = "md",
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-paper-sunken p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-md font-medium transition-colors",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
              active
                ? accent === "teal"
                  ? "bg-teal-500 text-white"
                  : "bg-amber-500 text-white"
                : "text-ink-soft hover:bg-paper-raised",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}