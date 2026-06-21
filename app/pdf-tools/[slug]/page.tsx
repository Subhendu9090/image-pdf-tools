import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import FAQSection from "@/components/FAQSection";
import { PdfInputWorkspace } from "@/components/PdfInputWorkspace";
import { toolFaqs } from "@/data/faqs";
import { getToolBySlug, pdfTools } from "@/data/tools";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return pdfTools.map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool || tool.category !== "pdf") {
    return {
      title: "PDF Tool Not Found",
    };
  }

  return {
    title: `${tool.title} Online`,
    description: `${tool.description} Use Brightfold's ${tool.title.toLowerCase()} tool with a clean PDF upload interface.`,
    alternates: {
      canonical: `/pdf-tools/${tool.slug}`,
    },
  };
}

export default async function PdfToolDetailPage({ params }: Props) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool || tool.category !== "pdf") {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${tool.title} - Brightfold`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    description: tool.description,
    url: `https://example.com/pdf-tools/${tool.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="bg-white py-4 dark:bg-slate-950 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/pdf-tools"
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-600 dark:text-amber-300"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to PDF tools
          </Link>
          <div className="mt-8 grid gap-4 ">
            <div className=" flex gap-4 items-center justify-between ">
              <div>
                {/* <p className="mb-4 inline-flex rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                PDF tool
              </p> */}
                <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                  {tool.title}
                </h1>
                <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">
                  {tool.description}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                  Supported formats
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {tool.formats.map((format) => (
                    <span
                      key={format}
                      className="rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <PdfInputWorkspace tool={tool} />
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            "Upload files into the PDF input workspace.",
            "Adjust the settings that match this PDF tool.",
            "Run the action and download the result when processing is connected.",
          ].map((step) => (
            <article
              key={step}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <CheckCircle2
                className="size-7 text-amber-700 dark:text-amber-300"
                aria-hidden="true"
              />
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {step}
              </p>
            </article>
          ))}
        </div>
      </section>

      <FAQSection
        faqs={toolFaqs}
        title={`${tool.title} FAQ`}
        description={`Common questions about the ${tool.title.toLowerCase()} workflow.`}
      />
    </>
  );
}
