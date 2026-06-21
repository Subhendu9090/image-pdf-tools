import type { Metadata } from "next";
import SectionHeader from "@/components/SectionHeader";
import ToolCard from "@/components/ToolCard";
import { pdfTools } from "@/data/tools";

export const metadata: Metadata = {
  title: "PDF Tools Online",
  description:
    "Browse PDF tools to merge, split, compress, convert, protect, unlock, OCR, watermark, organize, and edit PDF files online.",
  alternates: {
    canonical: "/pdf-tools",
  },
};

export default function PdfToolsIndexPage() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="PDF tools"
          title="Choose a PDF tool"
          description="Merge, split, compress, convert, secure, organize, OCR, and edit PDF files from one clean PDF tools directory."
          centered
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pdfTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}
