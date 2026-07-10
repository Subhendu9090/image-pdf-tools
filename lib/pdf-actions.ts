import { PDFDocument, degrees } from "pdf-lib";

export type PdfActionOptions = {
  pageRanges?: string;
  compression?: "light" | "balanced" | "strong";
  rotation?: "90" | "180" | "270";
  password?: string;
  outputFormat?: "png" | "jpg";
  watermark?: string;
  pageNumberPosition?: "bottom-center" | "bottom-right" | "top-right";
  ocrLanguage?: "eng" | "hin" | "spa";
  scanCleanup?: boolean;
};

export type PdfActionResult = {
  fileName: string;
  blob: Blob;
};

export async function processPdfTool(
  slug: string,
  files: File[],
  options: PdfActionOptions,
) {
  switch (slug) {
    case "merge-pdf":
      return [await mergePdf(files)];
    case "split-pdf":
      return splitPdf(files, options);
    case "compress-pdf":
      return compressPdf(files, options);
    case "pdf-to-image":
      return convertPdfToImage(files, options);
    case "image-to-pdf":
      return [await convertImageToPdf(files)];
    case "pdf-to-word":
      return convertPdfToWord(files, options);
    case "word-to-pdf":
      return convertWordToPdf(files, options);
    case "pdf-to-excel":
      return convertPdfToExcel(files, options);
    case "excel-to-pdf":
      return convertExcelToPdf(files, options);
    case "pdf-to-powerpoint":
      return convertPdfToPowerPoint(files, options);
    case "powerpoint-to-pdf":
      return convertPowerPointToPdf(files, options);
    case "rotate-pdf":
      return rotatePdf(files, options);
    case "protect-pdf":
      return protectPdf(files, options);
    case "unlock-pdf":
      return unlockPdf(files, options);
    case "organize-pdf":
      return organizePdf(files, options);
    case "extract-pdf-pages":
      return extractPdfPages(files, options);
    case "delete-pdf-pages":
      return deletePdfPages(files, options);
    case "add-page-numbers":
      return addPageNumbers(files, options);
    case "add-watermark":
      return addWatermark(files, options);
    case "pdf-ocr":
      return runPdfOcr(files, options);
    case "scan-to-pdf":
      return [await scanToPdf(files, options)];
    default:
      throw new Error("Unknown PDF tool.");
  }
}

export async function mergePdf(files: File[]): Promise<PdfActionResult> {
  if (files.length < 2) throw new Error("Please add at least two PDFs.");

  const merged = await PDFDocument.create();

  for (const file of files) {
    assertPdf(file);
    const source = await PDFDocument.load(await file.arrayBuffer());
    const pages = await merged.copyPages(source, source.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  return {
    fileName: "merged.pdf",
    blob: toPdfBlob(await merged.save()),
  };
}

export async function splitPdf(
  files: File[],
  options: PdfActionOptions,
): Promise<PdfActionResult[]> {
  const file = firstFile(files);
  assertPdf(file);

  const source = await PDFDocument.load(await file.arrayBuffer());
  const pageIndexes = parsePageRanges(options.pageRanges, source.getPageCount());

  return Promise.all(
    pageIndexes.map(async (pageIndex) => {
      const output = await PDFDocument.create();
      const [page] = await output.copyPages(source, [pageIndex]);
      output.addPage(page);

      return {
        fileName: `${baseName(file.name)}-page-${pageIndex + 1}.pdf`,
        blob: toPdfBlob(await output.save()),
      };
    }),
  );
}

export async function compressPdf(
  files: File[],
  options: PdfActionOptions,
): Promise<PdfActionResult[]> {
  // pdf-lib rewrites the PDF. Deeper image/font compression can be added later.
  void options;
  return Promise.all(files.map((file) => rewritePdf(file, "compressed")));
}

export async function convertPdfToImage(
  files: File[],
  options: PdfActionOptions,
): Promise<PdfActionResult[]> {
  return placeholderResults(
    files,
    `PDF to ${options.outputFormat ?? "png"} rendering will be added here.`,
    "txt",
  );
}

export async function convertImageToPdf(files: File[]): Promise<PdfActionResult> {
  if (files.length === 0) throw new Error("Please add at least one image.");

  const pdf = await PDFDocument.create();

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const image = file.type === "image/png"
      ? await pdf.embedPng(bytes)
      : await pdf.embedJpg(bytes);
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  return {
    fileName: "images.pdf",
    blob: toPdfBlob(await pdf.save()),
  };
}

export async function convertPdfToWord(files: File[], options: PdfActionOptions) {
  void options;
  return placeholderResults(files, "PDF to Word conversion will be added here.", "docx");
}

export async function convertWordToPdf(files: File[], options: PdfActionOptions) {
  void options;
  return placeholderResults(files, "Word to PDF conversion will be added here.", "pdf");
}

export async function convertPdfToExcel(files: File[], options: PdfActionOptions) {
  void options;
  return placeholderResults(files, "PDF to Excel extraction will be added here.", "xlsx");
}

export async function convertExcelToPdf(files: File[], options: PdfActionOptions) {
  void options;
  return placeholderResults(files, "Excel to PDF conversion will be added here.", "pdf");
}

export async function convertPdfToPowerPoint(files: File[], options: PdfActionOptions) {
  void options;
  return placeholderResults(files, "PDF to PowerPoint conversion will be added here.", "pptx");
}

export async function convertPowerPointToPdf(files: File[], options: PdfActionOptions) {
  void options;
  return placeholderResults(files, "PowerPoint to PDF conversion will be added here.", "pdf");
}

export async function rotatePdf(
  files: File[],
  options: PdfActionOptions,
): Promise<PdfActionResult[]> {
  const angle = Number(options.rotation ?? "90");

  return Promise.all(
    files.map(async (file) => {
      assertPdf(file);
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      pdf.getPages().forEach((page) => page.setRotation(degrees(angle)));
      return {
        fileName: `${baseName(file.name)}-rotated.pdf`,
        blob: toPdfBlob(await pdf.save()),
      };
    }),
  );
}

export async function protectPdf(files: File[], options: PdfActionOptions) {
  if (!options.password) throw new Error("Please enter a password.");
  return placeholderResults(files, "Password protection will be added with a PDF encryption engine.", "pdf");
}

export async function unlockPdf(files: File[], options: PdfActionOptions) {
  if (!options.password) throw new Error("Please enter the current password.");
  return placeholderResults(files, "PDF unlock logic will be added here.", "pdf");
}

export async function organizePdf(files: File[], options: PdfActionOptions) {
  void options;
  return Promise.all(files.map((file) => rewritePdf(file, "organized")));
}

export async function extractPdfPages(files: File[], options: PdfActionOptions) {
  const file = firstFile(files);
  assertPdf(file);

  const source = await PDFDocument.load(await file.arrayBuffer());
  const pageIndexes = parsePageRanges(options.pageRanges, source.getPageCount());
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, pageIndexes);
  pages.forEach((page) => output.addPage(page));

  return [{
    fileName: `${baseName(file.name)}-extracted.pdf`,
    blob: toPdfBlob(await output.save()),
  }];
}

export async function deletePdfPages(files: File[], options: PdfActionOptions) {
  const file = firstFile(files);
  assertPdf(file);

  const source = await PDFDocument.load(await file.arrayBuffer());
  const pagesToDelete = new Set(parsePageRanges(options.pageRanges, source.getPageCount()));
  const pageIndexes = source.getPageIndices().filter((index) => !pagesToDelete.has(index));
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, pageIndexes);
  pages.forEach((page) => output.addPage(page));

  return [{
    fileName: `${baseName(file.name)}-pages-deleted.pdf`,
    blob: toPdfBlob(await output.save()),
  }];
}

export async function addPageNumbers(files: File[], options: PdfActionOptions) {
  void options;
  return placeholderResults(files, "Page number drawing will be added here.", "pdf");
}

export async function addWatermark(files: File[], options: PdfActionOptions) {
  void options;
  return placeholderResults(files, "Watermark drawing will be added here.", "pdf");
}

export async function runPdfOcr(files: File[], options: PdfActionOptions) {
  void options;
  return placeholderResults(files, "OCR processing will be added here.", "pdf");
}

export async function scanToPdf(files: File[], options: PdfActionOptions) {
  void options;
  const imageFiles = files.filter((file) => file.type.startsWith("image/"));
  if (imageFiles.length > 0) return convertImageToPdf(imageFiles);
  return mergePdf(files);
}

async function rewritePdf(file: File, suffix: string): Promise<PdfActionResult> {
  assertPdf(file);
  const pdf = await PDFDocument.load(await file.arrayBuffer());
  return {
    fileName: `${baseName(file.name)}-${suffix}.pdf`,
    blob: toPdfBlob(await pdf.save()),
  };
}

function placeholderResults(files: File[], message: string, extension: string) {
  if (files.length === 0) throw new Error("Please add at least one file.");
  return files.map((file) => ({
    fileName: `${baseName(file.name)}.${extension}`,
    blob: new Blob([`${message}\n\nSource: ${file.name}`], {
      type: extension === "pdf" ? "application/pdf" : "text/plain",
    }),
  }));
}

function parsePageRanges(value: string | undefined, pageCount: number) {
  if (!value?.trim()) return [...Array(pageCount).keys()];

  const pages = new Set<number>();
  for (const part of value.split(",")) {
    const [startText, endText] = part.trim().split("-");
    const start = Number(startText);
    const end = Number(endText ?? startText);

    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;

    for (let page = start; page <= end; page += 1) {
      if (page >= 1 && page <= pageCount) pages.add(page - 1);
    }
  }

  return pages.size ? [...pages].sort((a, b) => a - b) : [...Array(pageCount).keys()];
}

function firstFile(files: File[]) {
  if (files.length === 0) throw new Error("Please add a file.");
  return files[0];
}

function assertPdf(file: File) {
  if (file.type !== "application/pdf") {
    throw new Error(`${file.name} is not a PDF file.`);
  }
}

function toPdfBlob(bytes: Uint8Array) {
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}

function baseName(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "");
}
