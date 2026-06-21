import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, Lock, Sparkles, UploadCloud, Zap } from "lucide-react";
import FAQSection from "@/components/FAQSection";
import SectionHeader from "@/components/SectionHeader";
import ToolCard from "@/components/ToolCard";
import { homeFaqs } from "@/data/faqs";
import { imageTools, pdfTools, popularTools } from "@/data/tools";

export const metadata: Metadata = {
  title: "Free PDF and Image Tools Online",
  description:
    "Use FileCraft to merge, split, compress, convert, resize, crop, OCR, and organize PDFs and images with a clean online interface.",
  alternates: {
    canonical: "/",
  },
};

const benefits = [
  {
    title: "Simple workflows",
    description: "Clear upload areas, previews, and actions make every tool easy to use.",
    icon: Sparkles,
  },
  {
    title: "Fast interface",
    description: "Lightweight pages and focused layouts help users find the right tool quickly.",
    icon: Zap,
  },
  {
    title: "Privacy-ready",
    description: "The frontend is prepared for secure processing logic when the backend is added.",
    icon: Lock,
  },
];

const steps = [
  "Choose the PDF or image tool you need.",
  "Upload your file and check the preview area.",
  "Run the action and download the result when processing is connected.",
];

export default function Home() {
  const webApplicationJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "FileCraft",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    description:
      "Online PDF and image tools for converting, compressing, editing, OCR, and document organization.",
    url: "https://example.com",
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homeFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="relative overflow-hidden bg-white py-20 dark:bg-slate-950 sm:py-28">
        <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-cyan-100 to-transparent dark:from-cyan-950/40" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-200">
              PDF and image tools in one place
            </p>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-6xl">
              Convert, edit, and organize files with FileCraft.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              A modern, SEO-friendly website for PDF and image tools. Merge PDFs,
              compress images, convert file formats, and prepare documents with a clean interface.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tools"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-900/20 transition hover:scale-[1.02]"
              >
                Explore all tools
              </Link>
              <Link
                href="/pdf-tools"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-cyan-300 hover:text-cyan-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                View PDF tools
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30">
            <div className="rounded-3xl bg-gradient-to-br from-slate-50 to-cyan-50 p-6 dark:from-slate-950 dark:to-cyan-950/30">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-cyan-600 text-white">
                  <UploadCloud className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                    Quick upload workspace
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Frontend UI ready for conversion logic.
                  </p>
                </div>
              </div>
              <div className="mt-8 grid gap-3">
                {popularTools.slice(0, 4).map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:translate-x-1 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {tool.title}
                    <span className="text-cyan-700 dark:text-cyan-300">Open</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ToolSection
        eyebrow="Popular tools"
        title="Most used file tools"
        description="Start with the tools users are most likely to need for daily PDF and image work."
        tools={popularTools.slice(0, 8)}
      />

      <ToolSection
        eyebrow="PDF tools"
        title="Edit and convert PDF files"
        description="Merge, split, compress, protect, OCR, and convert PDF files with simple tool pages."
        tools={pdfTools.slice(0, 8)}
        href="/pdf-tools"
      />

      <ToolSection
        eyebrow="Image tools"
        title="Resize, compress, and convert images"
        description="Useful image tools for modern formats, web optimization, and everyday edits."
        tools={imageTools.slice(0, 8)}
        href="/image-tools"
      />

      <section className="bg-white py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Why choose us"
            title="A professional tool website foundation"
            description="FileCraft is built with reusable components, clean content, responsive layouts, and search-friendly pages."
            centered
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {benefits.map((benefit) => (
              <article
                key={benefit.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <benefit.icon className="size-8 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <SectionHeader
            eyebrow="How it works"
            title="Three simple steps"
            description="Each tool page follows a familiar process so users know exactly what to do."
          />
          <div className="grid gap-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="pt-2 text-slate-700 dark:text-slate-200">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <CheckCircle2 className="mx-auto size-10 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Online PDF and image converter tools for everyday work
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
            FileCraft helps people discover the right PDF converter, image compressor,
            image resizer, PDF organizer, OCR tool, and format converter from one
            responsive website. Each page uses semantic content, helpful descriptions,
            clean URLs, and structured data so the site is ready for search engines
            and easy for visitors to navigate.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <Clock className="size-4" aria-hidden="true" />
            Backend conversion logic can be added next.
          </div>
        </div>
      </section>

      <FAQSection faqs={homeFaqs} />
    </>
  );
}

function ToolSection({
  eyebrow,
  title,
  description,
  tools,
  href,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tools: typeof popularTools;
  href?: string;
}) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader eyebrow={eyebrow} title={title} description={description} />
          {href ? (
            <Link
              href={href}
              className="text-sm font-semibold text-cyan-700 hover:text-cyan-600 dark:text-cyan-300"
            >
              View all
            </Link>
          ) : null}
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}
