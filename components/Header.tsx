"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon,
  FileText,
  Crop,
  Repeat,
  Gauge,
  Layers,
  Scissors,
  Combine,
  Lock,
  Unlock,
  RotateCw,
  FileOutput,
  Minimize2,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  Sparkles,
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
    href: "/image-tools#convert",
  },
  {
    label: "Compress",
    description: "Shrink file size, keep clarity",
    icon: Minimize2,
    href: "/image-tools#compress",
  },
  {
    label: "Resize",
    description: "Exact dimensions or scale %",
    icon: Crop,
    href: "/image-tools#resize",
  },
  {
    label: "Batch process",
    description: "Apply one setting to every file",
    icon: Layers,
    href: "/image-tools#batch",
  },
];

const PDF_ITEMS: MegaItem[] = [
  {
    label: "Merge PDFs",
    description: "Combine files in your order",
    icon: Combine,
    href: "/pdf-tools#merge",
  },
  {
    label: "Split & extract",
    description: "Pull out pages or page ranges",
    icon: Scissors,
    href: "/pdf-tools#split",
  },
  {
    label: "Compress",
    description: "Reduce size for sharing",
    icon: Gauge,
    href: "/pdf-tools#compress",
  },
  {
    label: "Rotate pages",
    description: "Fix sideways scans",
    icon: RotateCw,
    href: "/pdf-tools#rotate",
  },
  {
    label: "Protect with password",
    description: "Lock a PDF before sending it",
    icon: Lock,
    href: "/pdf-tools#protect",
  },
  {
    label: "Remove password",
    description: "Unlock a PDF you own",
    icon: Unlock,
    href: "/pdf-tools#unlock",
  },
  {
    label: "Convert to PDF",
    description: "Images and docs to PDF",
    icon: FileOutput,
    href: "/pdf-tools#convert",
  },
  {
    label: "PDF to images",
    description: "Export pages as JPG or PNG",
    icon: ImageIcon,
    href: "/pdf-tools#export",
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
      {/* Overlay - separate from header */}
      {openMenu && (
        <div
          className="fixed inset-0 z-40 opacity-90 backdrop-blur-lg transition-all duration-200"
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
          className="absolute left-1/2 top-[calc(100%+8px)] z-50 w-[640px] -translate-x-1/2 animate-fade-up"
          role="menu"
        >
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-paper/95 backdrop-blur-xl shadow-2xl">
            <div className="grid grid-cols-2 gap-1 p-3">
              {items.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  role="menuitem"
                  className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-paper-sunken"
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
                  <span>
                    <span className="block text-sm font-medium text-ink">
                      {item.label}
                    </span>
                    <span className="block text-xs text-ink-faint">
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