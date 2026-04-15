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
    <section className="studio-panel px-4 py-4 sm:px-5 sm:py-5">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        <label className="block">
          <span className="studio-kicker !mb-2 !flex !text-[0.62rem] !tracking-[0.18em]">Prix minimum</span>
          <input
            value={filters.priceMin}
            onChange={(e) => setFilters((prev) => ({ ...prev, priceMin: e.target.value }))}
            type="number"
            placeholder="Ex: 25000"
            className="px-4 py-3 text-sm"
          />
        </label>
        <label className="block">
          <span className="studio-kicker !mb-2 !flex !text-[0.62rem] !tracking-[0.18em]">Prix maximum</span>
          <input
            value={filters.priceMax}
            onChange={(e) => setFilters((prev) => ({ ...prev, priceMax: e.target.value }))}
            type="number"
            placeholder="Ex: 350000"
            className="px-4 py-3 text-sm"
          />
        </label>
        <label className="block">
          <span className="studio-kicker !mb-2 !flex !text-[0.62rem] !tracking-[0.18em]">Niche</span>
          <input
            value={filters.niche}
            onChange={(e) => setFilters((prev) => ({ ...prev, niche: e.target.value }))}
            placeholder="SaaS, IA, media..."
            className="px-4 py-3 text-sm"
          />
        </label>
        <label className="block">
          <span className="studio-kicker !mb-2 !flex !text-[0.62rem] !tracking-[0.18em]">Type d&apos;actif</span>
          <input
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
            placeholder="Application, e-commerce..."
            className="px-4 py-3 text-sm"
          />
        </label>
        <button onClick={onApply} className="studio-button-primary min-h-[56px] text-sm xl:self-end">
          Appliquer les filtres
        </button>
      </div>
    </section>
  );
}
