"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ListingManagementCard } from "@/components/dashboard/listing-management-card";

type DashboardListing = {
  id: string;
  title: string;
  askingPrice: number;
  status: string;
  _count: { offers: number };
};

type ListingsRailProps = {
  listings: DashboardListing[];
  busyKey: string | null;
  onDelete: (listingId: string) => void;
};

export function ListingsRail({ listings, busyKey, onDelete }: ListingsRailProps) {
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (listings.length === 0) {
      setActiveIndex(0);
      return;
    }

    if (activeIndex > listings.length - 1) {
      setActiveIndex(0);
    }
  }, [activeIndex, listings.length]);

  const scrollToIndex = (targetIndex: number) => {
    if (listings.length === 0) {
      return;
    }

    const normalizedIndex = (targetIndex + listings.length) % listings.length;
    setActiveIndex(normalizedIndex);
    itemRefs.current[normalizedIndex]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  };

  if (listings.length === 0) {
    return <p className="text-sm text-slate-500">Aucune annonce pour le moment.</p>;
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
          {listings.length} annonce{listings.length > 1 ? "s" : ""}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            aria-label="Annonce precedente"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            aria-label="Annonce suivante"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {activeIndex + 1} / {listings.length}
          </span>
        </div>
      </div>

      <div className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 dashboard-scrollbar">
        {listings.map((listing, index) => (
          <div
            key={listing.id}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            className="min-w-[320px] max-w-[420px] flex-1 snap-start shrink-0"
          >
            <ListingManagementCard listing={listing} busy={busyKey === `listing-${listing.id}`} onDelete={() => onDelete(listing.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}