"use client";

import { cn } from "@/lib/utils";

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  accent?: "teal" | "amber";
  label?: string;
  valueLabel?: string;
  id?: string;
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  accent = "teal",
  label,
  valueLabel,
  id,
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;
  const trackColor = accent === "teal" ? "#2D6A5C" : "#D98E48";

  return (
    <div>
      {label && (
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor={id} className="text-sm font-medium text-ink">
            {label}
          </label>
          <span className="font-mono text-xs text-ink-faint">
            {valueLabel ?? value}
          </span>
        </div>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "h-1.5 w-full cursor-pointer appearance-none rounded-full",
        )}
        style={{
          background: `linear-gradient(
      to right,
      ${trackColor} 0%,
      ${trackColor} ${percent}%,
      #D1D5DB ${percent}%,
      #D1D5DB 100%
    )`,
        }}
      />
      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${trackColor};
          border: 2px solid var(--paper-raised);
          box-shadow: 0 0 0 1px var(--border-strong);
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: ${trackColor};
          border: 2px solid var(--paper-raised);
          box-shadow: 0 0 0 1px var(--border-strong);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
