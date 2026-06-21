import type { Metadata } from "next";
import { Mail, MapPin, MessageSquare } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact FileCraft for questions about PDF tools, image tools, partnerships, and future conversion features.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Contact"
          title="Get in touch"
          description="Use this clean contact page as a base for a real form or support inbox."
          centered
        />
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Email",
              value: "hello@example.com",
              icon: Mail,
            },
            {
              title: "Support",
              value: "PDF and image tool questions",
              icon: MessageSquare,
            },
            {
              title: "Location",
              value: "Available online",
              icon: MapPin,
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <item.icon className="mx-auto size-8 text-cyan-700 dark:text-cyan-300" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">
                {item.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {item.value}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
