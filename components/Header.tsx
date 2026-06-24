"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon,
  FileText,
  FileType,
  Crop,
  Repeat,
  Layers,
  Scissors,
  Combine,
  Unlock,
  ShieldCheck,
  RotateCw,
  Minimize2,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Archive,
  FileImage,
  ImagePlus,
  Table,
  Sheet,
  Presentation,
  Projector,
  PanelTop,
  Copy,
  ListOrdered,
  Badge,
  ScanText,
  ScanLine,
  Trash2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface MegaItem {
  label: string;
  description: string;
  icon: typeof Crop;
  href: string;
}

const IMAGE_ITEMS: MegaItem[] = [
  {
    label: "Convert format",
    description: "JPG, PNG, WebP, AVIF & more",
    icon: Repeat,
    href: "/image-tools/convert",
  },
  {
    label: "Compress",
    description: "Shrink file size, keep clarity",
    icon: Minimize2,
    href: "/image-tools/compress",
  },
  {
    label: "Resize",
    description: "Exact dimensions or scale %",
    icon: Crop,
    href: "/image-tools/resize",
  },
  {
    label: "Batch process",
    description: "Apply one setting to every file",
    icon: Layers,
    href: "/image-tools/batch",
  },
];

const PDF_ITEMS: MegaItem[] = [
  {
    label: "Merge PDFs",
    description: "Combine files in your order",
    icon: Combine,
    href: "/pdf-tools/merge-pdf",
  },
  {
    label: "Split & extract",
    description: "Pull out pages or page ranges",
    icon: Scissors,
    href: "/pdf-tools/split-pdf",
  },
  {
    label: "Compress",
    description: "Reduce size for sharing",
    icon: Archive,
    href: "/pdf-tools/compress-pdf",
  },
  {
    label: "PDF to Image",
    description: "Export pages as images",
    icon: FileImage,
    href: "/pdf-tools/pdf-to-image",
  },
  {
    label: "Image to PDF",
    description: "Build a PDF from images",
    icon: ImagePlus,
    href: "/pdf-tools/image-to-pdf",
  },
  {
    label: "PDF to Word",
    description: "Create editable documents",
    icon: FileText,
    href: "/pdf-tools/pdf-to-word",
  },
  {
    label: "Word to PDF",
    description: "Export DOC or DOCX files",
    icon: FileType,
    href: "/pdf-tools/word-to-pdf",
  },
  {
    label: "PDF to Excel",
    description: "Extract tables to sheets",
    icon: Table,
    href: "/pdf-tools/pdf-to-excel",
  },
  {
    label: "Excel to PDF",
    description: "Turn sheets into reports",
    icon: Sheet,
    href: "/pdf-tools/excel-to-pdf",
  },
  {
    label: "PDF to PowerPoint",
    description: "Create editable slides",
    icon: Presentation,
    href: "/pdf-tools/pdf-to-powerpoint",
  },
  {
    label: "PowerPoint to PDF",
    description: "Save decks as PDFs",
    icon: Projector,
    href: "/pdf-tools/powerpoint-to-pdf",
  },
  {
    label: "Rotate pages",
    description: "Fix sideways scans",
    icon: RotateCw,
    href: "/pdf-tools/rotate-pdf",
  },
  {
    label: "Protect with password",
    description: "Lock a PDF before sending it",
    icon: ShieldCheck,
    href: "/pdf-tools/protect-pdf",
  },
  {
    label: "Remove password",
    description: "Unlock a PDF you own",
    icon: Unlock,
    href: "/pdf-tools/unlock-pdf",
  },
  {
    label: "Organize PDF",
    description: "Reorder and manage pages",
    icon: PanelTop,
    href: "/pdf-tools/organize-pdf",
  },
  {
    label: "Extract pages",
    description: "Save selected pages",
    icon: Copy,
    href: "/pdf-tools/extract-pdf-pages",
  },
  {
    label: "Delete pages",
    description: "Remove unwanted pages",
    icon: Trash2,
    href: "/pdf-tools/delete-pdf-pages",
  },
  {
    label: "Page numbers",
    description: "Add clean numbering",
    icon: ListOrdered,
    href: "/pdf-tools/add-page-numbers",
  },
  {
    label: "Watermark",
    description: "Add text or image marks",
    icon: Badge,
    href: "/pdf-tools/add-watermark",
  },
  {
    label: "PDF OCR",
    description: "Make scans searchable",
    icon: ScanText,
    href: "/pdf-tools/pdf-ocr",
  },
  {
    label: "Scan to PDF",
    description: "Create PDFs from scans",
    icon: ScanLine,
    href: "/pdf-tools/scan-to-pdf",
  },
];

type MenuKey = "image" | "pdf" | null;

export function Header() {
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(null);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  return (
    <>
      {openMenu && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/10 transition-opacity duration-200 dark:bg-black/25"
          onClick={() => setOpenMenu(null)}
        />
      )}

      <header className="sticky top-0 z-50 border-b border-border bg-paper/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-paper">
              <Sparkles className="h-4 w-4" strokeWidth={2.25} />
            </span>
            Brightfold
          </Link>

          {/* Desktop nav */}
          <nav
            ref={navRef}
            className="hidden items-center gap-1 lg:flex"
            aria-label="Primary"
          >
            <NavMenu
              label="Image Tools"
              icon={ImageIcon}
              accent="teal"
              items={IMAGE_ITEMS}
              href="/image-tools"
              isOpen={openMenu === "image"}
              onOpen={() => setOpenMenu("image")}
              onClose={() => setOpenMenu(null)}
            />
            <NavMenu
              label="PDF Tools"
              icon={FileText}
              accent="amber"
              items={PDF_ITEMS}
              href="/pdf-tools"
              isOpen={openMenu === "pdf"}
              onOpen={() => setOpenMenu("pdf")}
              onClose={() => setOpenMenu(null)}
            />
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle />
            <Link
              href="/image-tools"
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90"
            >
              Open a tool
            </Link>
          </div>

          {/* Mobile trigger */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="border-t border-border bg-paper px-4 pb-6 pt-2 lg:hidden">
            <MobileSection
              label="Image Tools"
              icon={ImageIcon}
              accent="teal"
              href="/image-tools"
              items={IMAGE_ITEMS}
              onNavigate={() => setMobileOpen(false)}
            />
            <MobileSection
              label="PDF Tools"
              icon={FileText}
              accent="amber"
              href="/pdf-tools"
              items={PDF_ITEMS}
              onNavigate={() => setMobileOpen(false)}
            />
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-ink-soft">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        )}
      </header>
    </>
  );
}

function NavMenu({
  label,
  icon: Icon,
  accent,
  items,
  href,
  isOpen,
  onOpen,
  onClose,
}: {
  label: string;
  icon: typeof ImageIcon;
  accent: "teal" | "amber";
  items: MegaItem[];
  href: string;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const accentText = accent === "teal" ? "text-teal-500" : "text-amber-500";
  const accentBg =
    accent === "teal"
      ? "bg-teal-50 dark:bg-teal-900/40"
      : "bg-amber-50 dark:bg-amber-900/30";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (isOpen ? onClose() : onOpen())}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-paper-sunken hover:text-ink",
          isOpen && "bg-paper-sunken text-ink",
        )}
        aria-expanded={isOpen}
      >
        <Icon className={cn("h-4 w-4", accentText)} strokeWidth={2} />
        {label}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "fixed left-1/2 top-[72px] z-[60] max-h-[calc(100vh-88px)] -translate-x-1/2 animate-fade-up overflow-y-auto px-4",
            items.length > 12
              ? "w-full max-w-5xl"
              : "w-full max-w-3xl",
          )}
          role="menu"
        >
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/50">
            <div
              className={cn(
                "grid gap-1 p-3",
                items.length > 12
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1 sm:grid-cols-2",
              )}
            >
              {items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  role="menuitem"
                  className="group flex min-w-0 items-start gap-3 rounded-md p-3 transition-colors hover:bg-paper-sunken"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      accentBg,
                    )}
                  >
                    <item.icon
                      className={cn("h-4.5 w-4.5", accentText)}
                      strokeWidth={2}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">
                      {item.label}
                    </span>
                    <span className="block text-xs leading-5 text-ink-faint">
                      {item.description}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
            <Link
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center justify-between border-t border-border px-5 py-3 text-sm font-medium transition-colors",
                accent === "teal"
                  ? "text-teal-600 hover:bg-teal-50/50 dark:text-teal-400 dark:hover:bg-teal-900/20"
                  : "text-amber-600 hover:bg-amber-50/50 dark:text-amber-400 dark:hover:bg-amber-900/20",
              )}
            >
              Open the full {label.toLowerCase()} workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function MobileSection({
  label,
  icon: Icon,
  accent,
  href,
  items,
  onNavigate,
}: {
  label: string;
  icon: typeof ImageIcon;
  accent: "teal" | "amber";
  href: string;
  items: MegaItem[];
  onNavigate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const accentText = accent === "teal" ? "text-teal-500" : "text-amber-500";

  return (
    <div className="border-b border-border py-2">
      <div className="flex items-center justify-between">
        <Link
          href={href}
          onClick={onNavigate}
          className="flex items-center gap-2 py-2 text-sm font-medium text-ink"
        >
          <Icon className={cn("h-4 w-4", accentText)} />
          {label}
        </Link>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={`Toggle ${label} list`}
          className="p-2 text-ink-faint"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              expanded && "rotate-180",
            )}
          />
        </button>
      </div>
      {expanded && (
        <div className="grid grid-cols-1 gap-0.5 pb-2 pl-2">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className="rounded-md px-3 py-2 text-sm text-ink-soft hover:bg-paper-sunken"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
