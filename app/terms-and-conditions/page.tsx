import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "Read the FileCraft terms and conditions for using PDF and image tool pages.",
  alternates: {
    canonical: "/terms-and-conditions",
  },
};

export default function TermsPage() {
  return (
    <section className="py-16 sm:py-20">
      <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white">
          Terms and Conditions
        </h1>
        <div className="mt-8 grid gap-5 text-base leading-8 text-slate-600 dark:text-slate-300">
          <p>
            FileCraft provides frontend pages for PDF and image tools. The current
            version is for interface and website structure only.
          </p>
          <p>
            Users are responsible for ensuring they have the right to upload, edit,
            convert, unlock, protect, or process any file they use with future tools.
          </p>
          <p>
            Production terms should be reviewed before launch, especially after adding
            backend conversion, file storage, payments, accounts, or third-party services.
          </p>
        </div>
      </article>
    </section>
  );
}
