import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import FAQSection from "@/components/FAQSection";
import {
  PdfInputWorkspace,
  type PdfWorkspaceData,
} from "@/components/PdfInputWorkspace";

type Props = {
  params: Promise<{ slug: string }>;
};

type PdfPageData = PdfWorkspaceData & {
  seoTitle: string;
  seoDescription: string;
  intro: string;
  steps: string[];
  features: string[];
};

const PDF_TOOLS: PdfPageData[] = [
  {
    slug: "merge-pdf",
    title: "Merge PDFs Online",
    description: "Combine files in your order.",
    seoTitle: "Merge PDFs Online",
    seoDescription: "Merge PDF files online into one document with a simple upload and download workflow.",
    intro: "Upload two or more PDFs and combine them into one file.",
    accept: "application/pdf",
    multiple: true,
    minFiles: 2,
    actionLabel: "Merge PDFs",
    steps: ["Upload PDFs.", "Check the order.", "Download one merged PDF."],
    features: ["Multiple PDF upload", "Single merged PDF output", "Runs in the browser"],
  },
  {
    slug: "split-pdf",
    title: "Split PDF Online",
    description: "Pull out pages or page ranges.",
    seoTitle: "Split PDF Online",
    seoDescription: "Split PDF files online by page range and download selected pages.",
    intro: "Upload one PDF and choose the pages you want to split or extract.",
    accept: "application/pdf",
    multiple: false,
    actionLabel: "Split PDF",
    settings: ["pageRanges"],
    steps: ["Upload one PDF.", "Enter page ranges.", "Download split pages."],
    features: ["Page range input", "Separate page outputs", "Simple PDF splitter"],
  },
  {
    slug: "compress-pdf",
    title: "Compress PDF Online",
    description: "Reduce size for sharing.",
    seoTitle: "Compress PDF Online",
    seoDescription: "Compress PDF files online with simple compression options.",
    intro: "Upload PDFs and choose how strongly you want to compress them.",
    accept: "application/pdf",
    multiple: true,
    actionLabel: "Compress PDF",
    settings: ["compression"],
    steps: ["Upload PDFs.", "Choose compression.", "Download compressed files."],
    features: ["Batch upload", "Compression levels", "Smaller PDF output"],
  },
  {
    slug: "pdf-to-image",
    title: "PDF to Image Converter",
    description: "Export pages as images.",
    seoTitle: "PDF to Image Converter Online",
    seoDescription: "Convert PDF pages to image files online.",
    intro: "Upload a PDF and choose JPG or PNG output.",
    accept: "application/pdf",
    multiple: false,
    actionLabel: "Convert PDF",
    settings: ["pageRanges", "outputFormat"],
    steps: ["Upload a PDF.", "Choose pages and format.", "Download image output."],
    features: ["JPG or PNG option", "Page ranges", "PDF page export"],
  },
  {
    slug: "image-to-pdf",
    title: "Image to PDF Converter",
    description: "Build a PDF from images.",
    seoTitle: "Image to PDF Converter Online",
    seoDescription: "Convert images to a PDF document online.",
    intro: "Upload JPG or PNG images and create one PDF.",
    accept: "image/jpeg,image/png",
    multiple: true,
    actionLabel: "Create PDF",
    steps: ["Upload images.", "Review the list.", "Download one PDF."],
    features: ["JPG and PNG input", "Multiple images", "Single PDF output"],
  },
  {
    slug: "pdf-to-word",
    title: "PDF to Word Converter",
    description: "Create editable documents.",
    seoTitle: "PDF to Word Converter Online",
    seoDescription: "Prepare PDF to Word conversion with a clean upload page.",
    intro: "Upload a PDF and prepare it for DOCX conversion.",
    accept: "application/pdf",
    multiple: false,
    actionLabel: "Convert to Word",
    settings: ["ocrLanguage"],
    steps: ["Upload PDF.", "Choose OCR language if needed.", "Download Word output."],
    features: ["PDF input", "OCR language option", "DOCX output placeholder"],
  },
  {
    slug: "word-to-pdf",
    title: "Word to PDF Converter",
    description: "Export DOC or DOCX files.",
    seoTitle: "Word to PDF Converter Online",
    seoDescription: "Convert Word documents to PDF online.",
    intro: "Upload Word documents and prepare PDF output.",
    accept: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    multiple: true,
    actionLabel: "Convert to PDF",
    steps: ["Upload Word files.", "Review selected files.", "Download PDFs."],
    features: ["DOC and DOCX input", "Batch upload", "PDF output placeholder"],
  },
  {
    slug: "pdf-to-excel",
    title: "PDF to Excel Converter",
    description: "Extract tables to sheets.",
    seoTitle: "PDF to Excel Converter Online",
    seoDescription: "Prepare PDF table extraction to Excel online.",
    intro: "Upload a PDF and prepare spreadsheet output.",
    accept: "application/pdf",
    multiple: false,
    actionLabel: "Convert to Excel",
    settings: ["ocrLanguage"],
    steps: ["Upload PDF.", "Choose OCR language if needed.", "Download Excel output."],
    features: ["PDF input", "Table extraction placeholder", "XLSX output"],
  },
  {
    slug: "excel-to-pdf",
    title: "Excel to PDF Converter",
    description: "Turn sheets into reports.",
    seoTitle: "Excel to PDF Converter Online",
    seoDescription: "Convert Excel spreadsheets to PDF online.",
    intro: "Upload XLS or XLSX files and prepare PDF reports.",
    accept: ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    multiple: true,
    actionLabel: "Convert to PDF",
    steps: ["Upload spreadsheets.", "Review selected files.", "Download PDFs."],
    features: ["XLS and XLSX input", "Batch upload", "PDF output placeholder"],
  },
  {
    slug: "pdf-to-powerpoint",
    title: "PDF to PowerPoint Converter",
    description: "Create editable slides.",
    seoTitle: "PDF to PowerPoint Converter Online",
    seoDescription: "Convert PDF pages to PowerPoint slides online.",
    intro: "Upload a PDF and prepare PPTX slide output.",
    accept: "application/pdf",
    multiple: false,
    actionLabel: "Convert to PowerPoint",
    settings: ["pageRanges"],
    steps: ["Upload PDF.", "Choose page ranges.", "Download PPTX output."],
    features: ["PDF input", "Page selection", "PPTX output placeholder"],
  },
  {
    slug: "powerpoint-to-pdf",
    title: "PowerPoint to PDF Converter",
    description: "Save decks as PDFs.",
    seoTitle: "PowerPoint to PDF Converter Online",
    seoDescription: "Convert PowerPoint files to PDF online.",
    intro: "Upload PPT or PPTX files and prepare PDF output.",
    accept: ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
    multiple: true,
    actionLabel: "Convert to PDF",
    steps: ["Upload presentations.", "Review selected files.", "Download PDFs."],
    features: ["PPT and PPTX input", "Batch upload", "PDF output placeholder"],
  },
  {
    slug: "rotate-pdf",
    title: "Rotate PDF Pages",
    description: "Fix sideways scans.",
    seoTitle: "Rotate PDF Pages Online",
    seoDescription: "Rotate PDF pages online by 90, 180, or 270 degrees.",
    intro: "Upload PDFs and rotate every page to the right direction.",
    accept: "application/pdf",
    multiple: true,
    actionLabel: "Rotate PDF",
    settings: ["rotation"],
    steps: ["Upload PDFs.", "Choose rotation.", "Download rotated PDFs."],
    features: ["90, 180, 270 degree options", "Batch upload", "Real PDF rotation"],
  },
  {
    slug: "protect-pdf",
    title: "Protect PDF with Password",
    description: "Lock a PDF before sending it.",
    seoTitle: "Protect PDF with Password Online",
    seoDescription: "Add password protection to PDF files online.",
    intro: "Upload PDFs and enter a password.",
    accept: "application/pdf",
    multiple: true,
    actionLabel: "Protect PDF",
    settings: ["password"],
    steps: ["Upload PDFs.", "Enter password.", "Download protected PDFs."],
    features: ["Password input", "Batch upload", "Protection placeholder"],
  },
  {
    slug: "unlock-pdf",
    title: "Unlock PDF Online",
    description: "Unlock a PDF you own.",
    seoTitle: "Unlock PDF Online",
    seoDescription: "Remove PDF password restrictions for files you own.",
    intro: "Upload locked PDFs and enter the current password.",
    accept: "application/pdf",
    multiple: true,
    actionLabel: "Unlock PDF",
    settings: ["password"],
    steps: ["Upload PDFs.", "Enter current password.", "Download unlocked files."],
    features: ["Current password input", "Batch upload", "Unlock placeholder"],
  },
  {
    slug: "organize-pdf",
    title: "Organize PDF Pages",
    description: "Reorder and manage pages.",
    seoTitle: "Organize PDF Pages Online",
    seoDescription: "Organize PDF pages online with a clean upload workflow.",
    intro: "Upload a PDF and prepare organization changes.",
    accept: "application/pdf",
    multiple: false,
    actionLabel: "Organize PDF",
    steps: ["Upload PDF.", "Review pages.", "Download organized PDF."],
    features: ["Single PDF input", "Organization placeholder", "PDF output"],
  },
  {
    slug: "extract-pdf-pages",
    title: "Extract PDF Pages",
    description: "Save selected pages.",
    seoTitle: "Extract PDF Pages Online",
    seoDescription: "Extract selected pages from PDF files online.",
    intro: "Upload a PDF and enter the pages you want to keep.",
    accept: "application/pdf",
    multiple: false,
    actionLabel: "Extract Pages",
    settings: ["pageRanges"],
    steps: ["Upload PDF.", "Enter page ranges.", "Download extracted PDF."],
    features: ["Page range input", "Real page extraction", "New PDF output"],
  },
  {
    slug: "delete-pdf-pages",
    title: "Delete PDF Pages",
    description: "Remove unwanted pages.",
    seoTitle: "Delete PDF Pages Online",
    seoDescription: "Delete selected pages from PDF files online.",
    intro: "Upload a PDF and enter the pages you want to remove.",
    accept: "application/pdf",
    multiple: false,
    actionLabel: "Delete Pages",
    settings: ["pageRanges"],
    steps: ["Upload PDF.", "Enter pages to delete.", "Download cleaned PDF."],
    features: ["Page range input", "Real page deletion", "PDF output"],
  },
  {
    slug: "add-page-numbers",
    title: "Add Page Numbers to PDF",
    description: "Add clean numbering.",
    seoTitle: "Add Page Numbers to PDF Online",
    seoDescription: "Add page numbers to PDF files online.",
    intro: "Upload PDFs and choose where page numbers should appear.",
    accept: "application/pdf",
    multiple: true,
    actionLabel: "Add Page Numbers",
    settings: ["pageNumberPosition"],
    steps: ["Upload PDFs.", "Choose position.", "Download numbered PDFs."],
    features: ["Position selector", "Batch upload", "Numbering placeholder"],
  },
  {
    slug: "add-watermark",
    title: "Add Watermark to PDF",
    description: "Add text or image marks.",
    seoTitle: "Add Watermark to PDF Online",
    seoDescription: "Add watermark text to PDF files online.",
    intro: "Upload PDFs and enter watermark text.",
    accept: "application/pdf",
    multiple: true,
    actionLabel: "Add Watermark",
    settings: ["watermark"],
    steps: ["Upload PDFs.", "Enter watermark text.", "Download watermarked PDFs."],
    features: ["Text input", "Batch upload", "Watermark placeholder"],
  },
  {
    slug: "pdf-ocr",
    title: "PDF OCR Online",
    description: "Make scans searchable.",
    seoTitle: "PDF OCR Online",
    seoDescription: "Run OCR on scanned PDF files online.",
    intro: "Upload scanned PDFs and choose OCR language.",
    accept: "application/pdf",
    multiple: true,
    actionLabel: "Run OCR",
    settings: ["ocrLanguage"],
    steps: ["Upload scanned PDFs.", "Choose language.", "Download searchable PDFs."],
    features: ["OCR language selector", "Batch upload", "OCR placeholder"],
  },
  {
    slug: "scan-to-pdf",
    title: "Scan to PDF Online",
    description: "Create PDFs from scans.",
    seoTitle: "Scan to PDF Online",
    seoDescription: "Create PDF files from scanned images online.",
    intro: "Upload scan images and create one PDF.",
    accept: "image/jpeg,image/png,application/pdf",
    multiple: true,
    actionLabel: "Create PDF",
    settings: ["scanCleanup"],
    steps: ["Upload scans.", "Choose cleanup option.", "Download PDF."],
    features: ["Image upload", "Scan cleanup option", "PDF output"],
  },
];

function getPdfPage(slug: string) {
  return PDF_TOOLS.find((tool) => tool.slug === slug);
}

export function generateStaticParams() {
  return PDF_TOOLS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = getPdfPage(slug);

  if (!tool) return { title: "PDF Tool Not Found" };

  return {
    title: tool.seoTitle,
    description: tool.seoDescription,
    alternates: { canonical: `/pdf-tools/${tool.slug}` },
    openGraph: {
      title: tool.seoTitle,
      description: tool.seoDescription,
      type: "website",
      url: `/pdf-tools/${tool.slug}`,
    },
  };
}

export default async function PdfToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = getPdfPage(slug);

  if (!tool) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${tool.title} - Brightfold`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    description: tool.seoDescription,
    url: `https://example.com/pdf-tools/${tool.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="bg-paper py-4 sm:py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/pdf-tools"
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-600 dark:text-amber-300"
            >
              <ArrowLeft className="size-4" />
              Back to PDF tools
            </Link>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
              PDF tool
            </span>
          </div>

          <div className="mt-4 max-w-4xl">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
              {tool.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-soft sm:text-base">
              {tool.intro}
            </p>
          </div>

          <div className="mt-5">
            <PdfInputWorkspace data={tool} />
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {tool.steps.map((step) => (
            <article
              key={step}
              className="rounded-lg border border-border bg-paper p-4 shadow-soft"
            >
              <CheckCircle2 className="size-5 text-amber-700 dark:text-amber-300" />
              <p className="mt-3 text-sm leading-6 text-ink-soft">{step}</p>
            </article>
          ))}
        </div>
      </section>

      <FAQSection
        title={`${tool.title} FAQ`}
        description={`Common questions about the ${tool.title.toLowerCase()} workflow.`}
        faqs={[
          {
            question: "Are files uploaded to a server?",
            answer: "No. The current PDF tools run in the browser or use simple frontend placeholders.",
          },
          {
            question: "Where is the tool logic?",
            answer: "All PDF functions are in lib/pdf-actions.ts, with one function per tool.",
          },
        ]}
      />
    </>
  );
}
