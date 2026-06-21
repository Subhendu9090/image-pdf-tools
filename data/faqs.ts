export type FAQ = {
  question: string;
  answer: string;
};

export const homeFaqs: FAQ[] = [
  {
    question: "Are these PDF and image tools free to use?",
    answer:
      "The current website is a frontend demo. The tool pages are ready for uploads and conversion actions, and the processing logic can be connected next.",
  },
  {
    question: "Which file formats are supported?",
    answer:
      "FileCraft includes PDF, JPG, PNG, WebP, SVG, HEIC, Word, Excel, and PowerPoint tool pages.",
  },
  {
    question: "Can I use the website on mobile?",
    answer:
      "Yes. The layout is responsive and designed for phones, tablets, laptops, and desktop screens.",
  },
  {
    question: "Is my uploaded file processed now?",
    answer:
      "No. Upload and preview interfaces are placeholders for now. Backend conversion logic will be added later.",
  },
];

export const toolFaqs: FAQ[] = [
  {
    question: "How do I use this tool?",
    answer:
      "Upload your file, review the preview area, choose the action, and download the finished file once processing is added.",
  },
  {
    question: "Will my files be stored?",
    answer:
      "This frontend does not upload files to a server yet. Future processing can be designed with privacy-first file handling.",
  },
  {
    question: "Can I use more than one file?",
    answer:
      "Tools such as merge, organize, and image to PDF are designed to support multiple files when backend logic is connected.",
  },
];
