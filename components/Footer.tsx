import Link from "next/link";
import { Image as ImageIcon, FileText, Sparkles, Mail, GitBranch } from "lucide-react";

const IMAGE_LINKS = [
  { label: "Convert format", href: "/image-tools#convert" },
  { label: "Compress images", href: "/image-tools#compress" },
  { label: "Resize images", href: "/image-tools#resize" },
  { label: "Batch process", href: "/image-tools#batch" },
];

const PDF_LINKS = [
  { label: "Merge PDFs", href: "/pdf-tools#merge" },
  { label: "Split PDF", href: "/pdf-tools#split" },
  { label: "Compress PDF", href: "/pdf-tools#compress" },
  { label: "Protect PDF", href: "/pdf-tools#protect" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-paper-raised">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 font-display text-lg font-semibold text-ink"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-paper">
                <Sparkles className="h-4 w-4" strokeWidth={2.25} />
              </span>
              Brightfold
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-faint">
              Image and PDF tools that run in your browser. Nothing you
              upload leaves your device unless a tool says otherwise.
            </p>
          </div>

          <div>
            <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold text-ink">
              <ImageIcon className="h-3.5 w-3.5 text-teal-500" />
              Image tools
            </h3>
            <ul className="mt-4 space-y-2.5">
              {IMAGE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-faint transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold text-ink">
              <FileText className="h-3.5 w-3.5 text-amber-500" />
              PDF tools
            </h3>
            <ul className="mt-4 space-y-2.5">
              {PDF_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-faint transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold text-ink">
              Get in touch
            </h3>
            <ul className="mt-4 space-y-2.5">
              <li>
                <a
                  href="mailto:hello@brightfold.app"
                  className="flex items-center gap-2 text-sm text-ink-faint transition-colors hover:text-ink"
                >
                  <Mail className="h-3.5 w-3.5" />
                  hello@brightfold.app
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  className="flex items-center gap-2 text-sm text-ink-faint transition-colors hover:text-ink"
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  Source on GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-ink-faint">
            © {new Date().getFullYear()} Brightfold. All processing happens
            locally in your browser.
          </p>
          <div className="flex gap-5 text-xs text-ink-faint">
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}