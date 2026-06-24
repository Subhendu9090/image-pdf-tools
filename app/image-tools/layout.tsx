"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Image as ImageIcon,
  LayoutGrid,
  Minimize2,
  Repeat,
  Crop,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOOL_COPY: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Image tools",
    description:
      "Convert, compress, resize, and enhance your images — JPG, PNG, WebP, AVIF, GIF, BMP, and ICO supported. Everything runs in your browser.",
  },
  "/compress": {
    title: "Compress images",
    description:
      "Reduce file size by lowering quality. JPG, PNG, WebP, AVIF — one file or a whole batch, all in your browser.",
  },
  "/convert": {
    title: "Convert image format",
    description:
      "Convert JPG, PNG, WebP, AVIF, GIF, BMP, and ICO images to a different format. Upload one file or a whole batch — everything runs in your browser.",
  },
  "/resize": {
    title: "Resize images",
    description:
      "Scale images by percentage or set exact pixel dimensions. Upload one file or a whole batch — everything runs in your browser.",
  },
  "/enhance": {
    title: "Enhance images",
    description:
      "Sharpen and brighten your images. Upload one file or a whole batch — everything runs in your browser.",
  },
};

const NAV_ITEMS = [
  { href: "/image-tools", label: "All tools", icon: LayoutGrid },
  { href: "/image-tools/compress", label: "Compress", icon: Minimize2 },
  { href: "/image-tools/convert", label: "Convert", icon: Repeat },
  { href: "/image-tools/resize", label: "Resize", icon: Crop },
  { href: "/image-tools/enhance", label: "Enhance", icon: Sparkles },
];

export default function ImageToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const copy = TOOL_COPY[pathname] ?? TOOL_COPY["/"];
  console.log("path name", pathname)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300">
            <ImageIcon className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              {copy.title}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-ink-soft">
              {copy.description}
            </p>
          </div>
        </div>
      </header>

      {/* Tab navbar to switch between tools */}
      <nav className="mb-8 flex flex-wrap md:justify-start justify-center items-center gap-1.5 border-b border-border pb-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href ===  pathname

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300"
                  : "border-border bg-paper-raised text-ink-soft hover:bg-paper-sunken",
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}

export { TOOL_COPY };