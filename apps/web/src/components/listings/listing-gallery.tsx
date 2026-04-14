"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { getListingGallery, ListingVisual } from "@/lib/listing-visuals";
import { Listing } from "@/types";

type ListingGalleryProps = {
  listing: Pick<
    Listing,
    "title" | "summary" | "type" | "niche" | "techStack" | "askingPrice" | "monthlyRevenue" | "monthlyProfit" | "imageUrls"
  >;
};

export function ListingGallery({ listing }: ListingGalleryProps) {
  const slides = getListingGallery(listing);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const activeSlide = slides[activeIndex];

  const goToSlide = (index: number) => {
    setActiveIndex((index + slides.length) % slides.length);
  };

  const moveSlide = (direction: 1 | -1) => {
    goToSlide(activeIndex + direction);
  };

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
      }

      if (event.key === "ArrowLeft") {
        moveSlide(-1);
      }

      if (event.key === "ArrowRight") {
        moveSlide(1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, isLightboxOpen, slides.length]);

  return (
    <>
      <div className="space-y-3">
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 card-glow">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            aria-label="Ouvrir l'image en grand"
            className="relative block aspect-[4/3] w-full overflow-hidden text-left sm:aspect-[16/9]"
          >
            <ListingGalleryPanel key={`preview-${activeIndex}`} listing={listing} slide={activeSlide} mode="preview" />

            <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm sm:right-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs">
              <Expand className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Voir en grand</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => moveSlide(-1)}
            aria-label="Image precedente"
            className="absolute left-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/55 text-white backdrop-blur-sm transition hover:border-teal-300/40 hover:bg-slate-950/75 sm:left-4 sm:h-11 sm:w-11"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => moveSlide(1)}
            aria-label="Image suivante"
            className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/55 text-white backdrop-blur-sm transition hover:border-teal-300/40 hover:bg-slate-950/75 sm:right-4 sm:h-11 sm:w-11"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 right-3 rounded-full border border-white/15 bg-slate-950/45 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm sm:bottom-4 sm:right-4 sm:text-xs">
            {activeIndex + 1} / {slides.length}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:hidden">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-700">
              {activeSlide.label}
            </span>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700">
              {listing.type}
            </span>
          </div>

          <p className="mt-3 text-lg font-semibold leading-tight text-slate-900 [overflow-wrap:anywhere]">{listing.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{activeSlide.caption}</p>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white">
            <MetricPill label="Prix" value={formatCurrency(listing.askingPrice)} />
            <MetricPill label="CA/mo" value={formatCurrency(listing.monthlyRevenue)} />
            <MetricPill label="Profit/mo" value={formatCurrency(listing.monthlyProfit)} />
          </div>
        </div>
      </div>

      {isLightboxOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/88 p-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Fermer l'image agrandie"
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-slate-950/60 text-white transition hover:border-slate-300/40"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl">
            <div className="relative aspect-[16/9] w-full">
              <ListingGalleryPanel key={`lightbox-${activeIndex}`} listing={listing} slide={activeSlide} mode="lightbox" />

              <button
                type="button"
                onClick={() => moveSlide(-1)}
                aria-label="Image precedente en grand"
                className="absolute left-4 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/60 text-white transition hover:border-teal-300/40"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={() => moveSlide(1)}
                aria-label="Image suivante en grand"
                className="absolute right-4 top-1/2 z-20 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/60 text-white transition hover:border-teal-300/40"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ListingGalleryPanel({
  listing,
  slide,
  mode,
}: {
  listing: ListingGalleryProps["listing"];
  slide: ListingVisual;
  mode: "preview" | "lightbox";
}) {
  const isRemoteSlide = /^https?:\/\//i.test(slide.src);
  const isPreview = mode === "preview";

  return (
    <div className="listing-gallery-slide absolute inset-0">
      <Image
        src={slide.src}
        alt={
          isPreview
            ? `Apercu visuel de ${listing.title} - ${slide.title}`
            : `Version agrandie de ${listing.title} - ${slide.title}`
        }
        fill
        sizes={isPreview ? "(max-width: 1024px) 100vw, 720px" : "100vw"}
        className={`listing-gallery-image object-cover ${isPreview ? "transition duration-500 group-hover:scale-[1.03]" : ""}`.trim()}
        priority={isPreview}
        unoptimized={isRemoteSlide}
      />
      <div className={`absolute inset-0 ${isPreview ? "bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/10" : "bg-gradient-to-t from-slate-950 via-slate-950/35 to-slate-950/5"}`} />

      {isPreview ? (
        <>
          <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2 sm:left-4 sm:top-4">
            <span className="rounded-full border border-white/15 bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
              {slide.label}
            </span>
            <span className="rounded-full border border-teal-300/25 bg-teal-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-100 backdrop-blur-sm">
              {listing.type}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 hidden p-5 sm:block">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{listing.niche}</p>
              <p className="mt-2 text-xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">{listing.title}</p>
              <p className="mt-2 max-w-xl text-xs leading-5 text-slate-200/90 sm:text-sm">{slide.caption}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white sm:mt-4 sm:text-sm">
              <MetricPill label="Prix" value={formatCurrency(listing.askingPrice)} />
              <MetricPill label="CA/mo" value={formatCurrency(listing.monthlyRevenue)} />
              <MetricPill label="Profit/mo" value={formatCurrency(listing.monthlyProfit)} />
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{slide.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{slide.title}</p>
          <p className="mt-2 max-w-3xl text-sm text-slate-200">{slide.caption}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm">
            <MetricPill label="Prix" value={formatCurrency(listing.askingPrice)} />
            <MetricPill label="CA/mo" value={formatCurrency(listing.monthlyRevenue)} />
            <MetricPill label="Profit/mo" value={formatCurrency(listing.monthlyProfit)} />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/15 bg-slate-950/35 px-3 py-1.5 backdrop-blur-sm">
      <span className="text-slate-300">{label}</span>
      <span className="ml-2 font-semibold text-white">{value}</span>
    </span>
  );
}