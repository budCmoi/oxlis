"use client";

import { Dispatch, SetStateAction } from "react";

export type Filters = {
  priceMin: string;
  priceMax: string;
  niche: string;
  type: string;
};

type Props = {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
  onApply: () => void;
};

export function FilterBar({ filters, setFilters, onApply }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-5">
        <input
          value={filters.priceMin}
          onChange={(e) => setFilters((prev) => ({ ...prev, priceMin: e.target.value }))}
          type="number"
          placeholder="Prix min"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
        />
        <input
          value={filters.priceMax}
          onChange={(e) => setFilters((prev) => ({ ...prev, priceMax: e.target.value }))}
          type="number"
          placeholder="Prix max"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
        />
        <input
          value={filters.niche}
          onChange={(e) => setFilters((prev) => ({ ...prev, niche: e.target.value }))}
          placeholder="Niche (SaaS, IA...)"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
        />
        <input
          value={filters.type}
          onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
          placeholder="Type (App, E-commerce...)"
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
        />
        <button
          onClick={onApply}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          Appliquer
        </button>
      </div>
    </section>
  );
}
