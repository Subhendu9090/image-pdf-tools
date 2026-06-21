import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the FileCraft privacy policy for the PDF and image tools website.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        FileCraft is currently a frontend interface for PDF and image tools. It does not
        process, upload, or store files on a backend server yet.
      </p>
      <p>
        When conversion logic is added, file handling should be designed with clear
        retention rules, secure processing, and transparent user controls.
      </p>
      <p>
        Basic analytics, contact forms, or account features may require additional
        privacy details before production launch.
      </p>
    </LegalPage>
  );
}

function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-16 sm:py-20">
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
          {title}
        </h1>
        <div className="mt-8 grid gap-5 text-base leading-8 text-slate-600 dark:text-slate-300">
          {children}
        </div>
      </article>
    </section>
  );
}
