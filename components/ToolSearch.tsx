"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { Tool, ToolCategory } from "@/data/tools";
import ToolCard from "./ToolCard";

type ToolSearchProps = {
  tools: Tool[];
};

const filters: { label: string; value: "all" | ToolCategory }[] = [
  { label: "All", value: "all" },
  { label: "PDF", value: "pdf" },
  { label: "Image", value: "image" },
];

export default function ToolSearch({ tools }: ToolSearchProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | ToolCategory>("all");

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesFilter = filter === "all" || tool.category === filter;
      const matchesQuery = `${tool.title} ${tool.description}`
        .toLowerCase()
        .includes(query.toLowerCase());

      return matchesFilter && matchesQuery;
    });
  }, [filter, query, tools]);

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search PDF and image tools"
            className="h-12 w-full rounded-full border border-slate-200 bg-slate-50 pl-12 pr-4 text-sm outline-none transition focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-cyan-700 dark:focus:ring-cyan-950"
          />
        </div>
        <div className="flex rounded-full bg-slate-100 p-1 dark:bg-slate-950">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === item.value
                  ? "bg-white text-cyan-700 shadow-sm dark:bg-slate-800 dark:text-cyan-300"
                  : "text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filteredTools.length ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
            No tools found
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Try a different keyword or switch the filter.
          </p>
        </div>
      )}
    </div>
  );
}
