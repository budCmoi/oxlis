"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { gsap } from "gsap";
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

  const moveSlide = useCallback((direction: 1 | -1) => {
    setActiveIndex((current) => (current + direction + slides.length) % slides.length);
  }, [slides.length]);

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
  }, [isLightboxOpen, moveSlide, slides.length]);

  return (
    <div className="image-slider-motion">
      <div className="space-y-3">
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 card-glow">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            aria-label="Ouvrir l'image en grand"
            className="relative block aspect-[4/3] w-full overflow-hidden text-left sm:aspect-[16/9]"
          >
            <ListingGalleryPanel key={`preview-${activeIndex}`} listing={listing} slide={activeSlide} mode="preview" />
          </button>

          <button
            type="button"
            onClick={() => moveSlide(-1)}
            aria-label="Image precedente"
            className="listing-gallery-control absolute left-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/55 text-white backdrop-blur-sm transition hover:border-teal-300/40 hover:bg-slate-950/75 sm:left-4 sm:h-9 sm:w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => moveSlide(1)}
            aria-label="Image suivante"
            className="listing-gallery-control absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/55 text-white backdrop-blur-sm transition hover:border-teal-300/40 hover:bg-slate-950/75 sm:right-4 sm:h-9 sm:w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLightboxOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/88 p-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Fermer l'image agrandie"
            className="listing-gallery-control absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-slate-950/60 text-white transition hover:border-slate-300/40"
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
                className="listing-gallery-control absolute left-4 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/60 text-white transition hover:border-teal-300/40"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => moveSlide(1)}
                aria-label="Image suivante en grand"
                className="listing-gallery-control absolute right-4 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-slate-950/60 text-white transition hover:border-teal-300/40"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const copyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const media = mediaRef.current;
    if (!panel || !media) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      gsap.set(panel, { autoAlpha: 1, y: 0 });
      gsap.set(media, { scale: 1 });
      if (copyRef.current) {
        gsap.set(copyRef.current.children, { autoAlpha: 1, y: 0 });
      }
      return;
    }

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      timeline.fromTo(
        panel,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: isPreview ? 0.5 : 0.58 },
      );

      timeline.fromTo(media, { scale: 1.045 }, { scale: 1, duration: isPreview ? 0.82 : 0.9, ease: "power2.out" }, 0);

      if (copyRef.current && copyRef.current.children.length > 0) {
        timeline.fromTo(
          Array.from(copyRef.current.children),
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, duration: 0.46, stagger: 0.06 },
          0.1,
        );
      }
    }, panel);

    return () => ctx.revert();
  }, [isPreview, slide.src, slide.title]);

  return (
    <div ref={panelRef} className="listing-gallery-slide absolute inset-0">
      <div ref={mediaRef} className="absolute inset-0">
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
      </div>
      <div className={`absolute inset-0 ${isPreview ? "bg-gradient-to-t from-slate-950 via-slate-950/50 to-slate-950/10" : "bg-gradient-to-t from-slate-950 via-slate-950/35 to-slate-950/5"}`} />

      {isPreview ? (
        <div ref={copyRef} className="absolute inset-x-0 bottom-0 p-4 sm:p-5 min-[1000px]:p-6">
          <p className="text-base font-semibold leading-tight tracking-tight text-white [overflow-wrap:anywhere] sm:text-lg min-[1000px]:text-3xl">
            {listing.title}
          </p>
          <p className="mt-1 max-w-xl text-[10px] leading-4 text-slate-200/90 sm:text-[11px] min-[1000px]:mt-2 min-[1000px]:text-sm min-[1000px]:leading-5">
            {slide.caption}
          </p>
        </div>
      ) : (
        <div ref={copyRef} className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-6 min-[1000px]:p-8">
          <p className="text-lg font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-xl min-[1000px]:text-3xl">
            {listing.title}
          </p>
          <p className="mt-1 max-w-3xl text-[10px] leading-4 text-slate-200/90 sm:text-[11px] min-[1000px]:mt-2 min-[1000px]:text-sm min-[1000px]:leading-5">
            {slide.caption}
          </p>
        </div>
      )}
    </div>
  );
}
