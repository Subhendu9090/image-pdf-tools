import type { Metadata } from "next";
import SectionHeader from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about FileCraft, a modern PDF and image tools website built for simple file conversion workflows.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="About FileCraft"
          title="Simple tools for everyday file work"
          description="FileCraft is a frontend-first website for PDF and image tools. It is designed to be clear, responsive, searchable, and ready for backend conversion features."
          centered
        />
        <div className="mt-10 grid gap-6 text-base leading-8 text-slate-600 dark:text-slate-300">
          <p>
            The goal is to make common file actions easy: merge PDFs, compress files,
            convert images, extract text, organize pages, and prepare documents for sharing.
          </p>
          <p>
            Each tool page uses a focused upload interface, helpful copy, clean navigation,
            and SEO-friendly metadata so visitors can quickly find what they need.
          </p>
        </div>
      </div>
    </section>
  );
}
