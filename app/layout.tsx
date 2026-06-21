import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/theme-provider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Image Tools — Convert, Compress & Resize Images Online | Brightfold",
  description:
    "Free online image converter and compressor. Convert JPG, PNG, WebP, AVIF, GIF, BMP, and ICO. Resize and reduce file size in your browser — no upload, no signup.",
  keywords: [
    "image converter",
    "compress image",
    "resize image",
    "jpg to png",
    "png to webp",
    "image to avif",
    "batch image converter",
  ],
  openGraph: {
    title: "Image Tools — Convert, Compress & Resize Images",
    description:
      "Convert and compress JPG, PNG, WebP, AVIF, GIF, BMP, and ICO images entirely in your browser.",
    type: "website",
  },
  alternates: {
    canonical: "/image-tools",
  },
};

// Inline script avoids a light/dark flash before the ThemeProvider mounts.
const noFlashScript = `
(function() {
  try {
    var stored = localStorage.getItem('toolkit-theme');
    var resolved = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (resolved === 'dark') document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = resolved;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="flex min-h-screen flex-col font-sans">
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
