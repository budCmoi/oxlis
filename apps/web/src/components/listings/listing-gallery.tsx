"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { getListingGallery } from "@/lib/listing-visuals";
import { Listing } from "@/types";

const slideMotionVariants = {
  enter: (direction: 1 | -1) => ({
    x: direction > 0 ? 56 : -56,
    opacity: 0,
    scale: 1.02,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
  exit: (direction: 1 | -1) => ({
    x: direction > 0 ? -56 : 56,
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

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
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const activeSlide = slides[activeIndex];
  const isRemoteSlide = /^https?:\/\//i.test(activeSlide.src);

  const goToSlide = (index: number, direction: 1 | -1 = 1) => {
    setSlideDirection(direction);
    setActiveIndex((index + slides.length) % slides.length);
  };

  const moveSlide = (direction: 1 | -1) => {
    goToSlide(activeIndex + direction, direction);
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
            className="relative block aspect-[16/9] w-full overflow-hidden text-left"
          >
            <AnimatePresence initial={false} custom={slideDirection} mode="wait">
              <motion.div
                key={`gallery-slide-${activeIndex}`}
                custom={slideDirection}
                variants={slideMotionVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="absolute inset-0"
              >
                <Image
                  src={activeSlide.src}
                  alt={`Apercu visuel de ${listing.title} - ${activeSlide.title}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 720px"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  priority
                  unoptimized={isRemoteSlide}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/10" />

                <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/15 bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
                    {activeSlide.label}
                  </span>
                  <span className="rounded-full border border-teal-300/25 bg-teal-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-100 backdrop-blur-sm">
                    {listing.type}
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <div className="max-w-2xl">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{listing.niche}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{listing.title}</p>
                    <p className="mt-2 max-w-xl text-sm text-slate-200/90">{activeSlide.caption}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-white sm:text-sm">
                    <MetricPill label="Prix" value={formatCurrency(listing.askingPrice)} />
                    <MetricPill label="CA/mo" value={formatCurrency(listing.monthlyRevenue)} />
                    <MetricPill label="Profit/mo" value={formatCurrency(listing.monthlyProfit)} />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="absolute right-4 top-4 z-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <Expand className="h-3.5 w-3.5" />
              Voir en grand
            </div>
          </button>

          <button
            type="button"
            onClick={() => moveSlide(-1)}
            aria-label="Image precedente"
            className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/55 text-white backdrop-blur-sm transition hover:border-teal-300/40 hover:bg-slate-950/75"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => moveSlide(1)}
            aria-label="Image suivante"
            className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/55 text-white backdrop-blur-sm transition hover:border-teal-300/40 hover:bg-slate-950/75"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 right-4 rounded-full border border-white/15 bg-slate-950/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            {activeIndex + 1} / {slides.length}
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-1">
          {slides.map((slide, index) => (
            <button
              key={`${slide.src}-${index}`}
              type="button"
              onClick={() => goToSlide(index, index >= activeIndex ? 1 : -1)}
              aria-label={`Aller a l'image ${index + 1}`}
              className={`min-w-[140px] overflow-hidden rounded-2xl border text-left transition ${
                index === activeIndex ? "border-teal-500 shadow-sm" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="relative aspect-[16/10] bg-slate-900">
                <Image
                  src={slide.src}
                  alt={`Miniature ${index + 1} pour ${listing.title}`}
                  fill
                  sizes="140px"
                  className="object-cover"
                  unoptimized={/^https?:\/\//i.test(slide.src)}
                />
              </div>
              <div className="bg-white px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{slide.label}</p>
                <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-900">{slide.title}</p>
              </div>
            </button>
          ))}
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
              <AnimatePresence initial={false} custom={slideDirection} mode="wait">
                <motion.div
                  key={`lightbox-slide-${activeIndex}`}
                  custom={slideDirection}
                  variants={slideMotionVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0"
                >
                  <Image
                    src={activeSlide.src}
                    alt={`Version agrandie de ${listing.title} - ${activeSlide.title}`}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    unoptimized={isRemoteSlide}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-slate-950/5" />
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{activeSlide.label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">{activeSlide.title}</p>
                    <p className="mt-2 max-w-3xl text-sm text-slate-200">{activeSlide.caption}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm">
                      <MetricPill label="Prix" value={formatCurrency(listing.askingPrice)} />
                      <MetricPill label="CA/mo" value={formatCurrency(listing.monthlyRevenue)} />
                      <MetricPill label="Profit/mo" value={formatCurrency(listing.monthlyProfit)} />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

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

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/15 bg-slate-950/35 px-3 py-1.5 backdrop-blur-sm">
      <span className="text-slate-300">{label}</span>
      <span className="ml-2 font-semibold text-white">{value}</span>
    </span>
  );
}