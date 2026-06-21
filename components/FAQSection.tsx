import type { FAQ } from "@/data/faqs";
import SectionHeader from "./SectionHeader";

type FAQSectionProps = {
  faqs: FAQ[];
  title?: string;
  description?: string;
};

export default function FAQSection({
  faqs,
  title = "Frequently asked questions",
  description = "Clear answers for common PDF and image tool questions.",
}: FAQSectionProps) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title={title} description={description} centered />
        <div className="mx-auto mt-10 grid max-w-4xl gap-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm open:border-cyan-200 dark:border-slate-800 dark:bg-slate-900"
            >
              <summary className="cursor-pointer list-none text-base font-semibold text-slate-950 marker:hidden dark:text-white">
                {faq.question}
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
