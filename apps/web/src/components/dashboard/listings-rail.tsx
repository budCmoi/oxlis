"use client";

import { useRef, useState } from "react";
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
  const currentIndex = listings.length === 0 ? 0 : Math.min(activeIndex, listings.length - 1);

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
        <div className="studio-pill self-start">
          {listings.length} annonce{listings.length > 1 ? "s" : ""}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => scrollToIndex(currentIndex - 1)}
            aria-label="Annonce precedente"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white/75 text-slate-700 hover:-translate-y-0.5 hover:bg-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(currentIndex + 1)}
            aria-label="Annonce suivante"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white/75 text-slate-700 hover:-translate-y-0.5 hover:bg-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="rounded-full border border-[var(--line)] bg-white/60 px-3 py-2 text-xs font-semibold text-slate-600">
            {currentIndex + 1} / {listings.length}
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
            className="min-w-[300px] max-w-[430px] flex-1 snap-start shrink-0 sm:min-w-[340px]"
          >
            <ListingManagementCard listing={listing} busy={busyKey === `listing-${listing.id}`} onDelete={() => onDelete(listing.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}