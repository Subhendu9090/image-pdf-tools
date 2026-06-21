import type { Metadata } from "next";
import SectionHeader from "@/components/SectionHeader";
import ToolSearch from "@/components/ToolSearch";
import { tools } from "@/data/tools";

export const metadata: Metadata = {
  title: "All PDF and Image Tools",
  description:
    "Browse every FileCraft PDF and image tool, including converters, compressors, OCR tools, resizers, PDF organizers, and more.",
  alternates: {
    canonical: "/tools",
  },
};

export default function ToolsPage() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="All tools"
          title="Find the right file tool"
          description="Search, filter, and open clean tool pages for PDF and image workflows."
          centered
        />
        <div className="mt-10">
          <ToolSearch tools={tools} />
        </div>
      </div>
    </section>
  );
}
