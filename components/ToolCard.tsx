import Link from "next/link";
import {
  Archive,
  Badge,
  Copy,
  Crop,
  Eraser,
  Expand,
  FileImage,
  FileOutput,
  FileText,
  FileType,
  Files,
  FlipHorizontal,
  Image,
  ImagePlus,
  Images,
  ListOrdered,
  LucideIcon,
  Minimize2,
  PanelTop,
  PenTool,
  Presentation,
  Projector,
  RefreshCw,
  RotateCcw,
  RotateCw,
  ScanLine,
  ScanText,
  Scissors,
  ShieldCheck,
  Sheet,
  Smartphone,
  Table,
  TextSearch,
  Trash2,
  Unlock,
  VectorSquare,
} from "lucide-react";
import type { Tool } from "@/data/tools";

const iconMap: Record<string, LucideIcon> = {
  Archive,
  Badge,
  Copy,
  Crop,
  Eraser,
  Expand,
  FileImage,
  FileOutput,
  FileText,
  FileType,
  Files,
  FlipHorizontal,
  Image,
  ImagePlus,
  Images,
  ListOrdered,
  Minimize2,
  PanelTop,
  PenTool,
  Presentation,
  Projector,
  RefreshCw,
  RotateCcw,
  RotateCw,
  ScanLine,
  ScanText,
  Scissors,
  ShieldCheck,
  Sheet,
  Smartphone,
  Table,
  TextSearch,
  Trash2,
  Unlock,
  VectorSquare,
};

type ToolCardProps = {
  tool: Tool;
};

export default function ToolCard({ tool }: ToolCardProps) {
  const Icon = iconMap[tool.icon] ?? Files;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-950/10 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-cyan-800 dark:hover:shadow-black/30"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <span className="flex size-12 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 transition group-hover:bg-cyan-600 group-hover:text-white dark:bg-cyan-950/40 dark:text-cyan-300 dark:ring-cyan-900">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {tool.category}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
        {tool.title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {tool.description}
      </p>
      <span className="mt-5 text-sm font-semibold text-cyan-700 dark:text-cyan-300">
        Open tool
      </span>
    </Link>
  );
}
