import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  accent?: "teal" | "amber";
  state?: "idle" | "processing" | "done" | "error";
}

export function ProgressRing({
  progress,
  size = 36,
  accent = "teal",
  state = "idle",
}: ProgressRingProps) {
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const colorClass =
    state === "error"
      ? "text-danger"
      : state === "done"
        ? accent === "teal"
          ? "text-teal-500"
          : "text-amber-500"
        : accent === "teal"
          ? "text-teal-400"
          : "text-amber-400";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn(colorClass)}
      role="img"
      aria-label={`${Math.round(progress)}% processed`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className={cn(
          "transition-[stroke-dashoffset] duration-300 ease-out",
          state === "processing" && "animate-pulse-edge",
        )}
      />
    </svg>
  );
}