"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const previewSlides = [
  {
    src: "/preview-marketplace.svg",
    alt: "Apercu du flux d'exploration des annonces OXLIS",
    title: "Explorer les meilleures opportunites",
  },
  {
    src: "/preview-dashboard.svg",
    alt: "Apercu du tableau de bord vendeur OXLIS",
    title: "Piloter vos annonces et vos offres",
  },
  {
    src: "/preview-messages.svg",
    alt: "Apercu de la messagerie et de la negociation OXLIS",
    title: "Negocier et conclure plus vite",
  },
  {
    src: "/listing-overview.svg",
    alt: "Apercu global de la plateforme et des annonces OXLIS",
    title: "Visualiser un deal avant de passer a l'action",
  },
];

type AuthShowcaseProps = {
  className?: string;
  viewportBounded?: boolean;
};

export function AuthShowcase({ className = "", viewportBounded = false }: AuthShowcaseProps) {
  const [activePreview, setActivePreview] = useState(0);
  const imageWrapperClassName = viewportBounded
    ? "relative aspect-[16/11] h-full min-h-[170px] sm:min-h-[320px] lg:aspect-auto lg:min-h-0 lg:h-full"
    : "relative aspect-[16/11] h-full min-h-[180px] sm:min-h-[360px] lg:aspect-auto lg:min-h-full";

  const movePreview = (direction: 1 | -1) => {
    setActivePreview((current) => (current + direction + previewSlides.length) % previewSlides.length);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActivePreview((current) => (current + 1) % previewSlides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <aside
      className={`overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_right,#99f6e4,transparent_32%),radial-gradient(circle_at_bottom_left,#bfdbfe,transparent_30%),linear-gradient(135deg,#0f172a,#111827_48%,#0f172a)] p-2.5 shadow-sm sm:rounded-[32px] sm:p-3 lg:flex lg:h-full lg:flex-col ${className}`}
    >
      <div className="relative overflow-hidden rounded-[20px] bg-slate-950 sm:rounded-[24px] lg:min-h-0 lg:flex-1">
        <div className={imageWrapperClassName}>
          {previewSlides.map((slide, index) => (
            <div
              key={slide.src}
              className={`absolute inset-0 transition-all duration-700 ${
                index === activePreview
                  ? "translate-x-0 opacity-100"
                  : index < activePreview
                    ? "-translate-x-10 opacity-0"
                    : "translate-x-10 opacity-0"
              }`}
              aria-hidden={index !== activePreview}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 980px"
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
            </div>
          ))}

          <div className="absolute left-3 top-3 rounded-full border border-white/15 bg-slate-950/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-200 backdrop-blur-sm sm:left-5 sm:top-5 sm:px-3 sm:text-xs">
            Experience OXLIS
          </div>
        </div>
      </div>

      <div className="mt-3 px-1 text-white sm:mt-4">
        <div className="sm:hidden">
          <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">Apercu {activePreview + 1} / {previewSlides.length}</p>
          <p className="mt-2 text-sm leading-5 text-slate-100">{previewSlides[activePreview]?.title}</p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {previewSlides.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  onClick={() => setActivePreview(index)}
                  aria-label={`Afficher l'apercu ${index + 1}`}
                  className={`h-2.5 rounded-full transition ${index === activePreview ? "w-6 bg-teal-300" : "w-2.5 bg-white/30"}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => movePreview(-1)}
                aria-label="Apercu precedent"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-slate-950/40 text-white transition hover:border-teal-300/40 hover:text-teal-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => movePreview(1)}
                aria-label="Apercu suivant"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-slate-950/40 text-white transition hover:border-teal-300/40 hover:text-teal-200"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Defilement automatique</p>
            <p className="mt-1 text-sm text-slate-200">Un apercu visuel du marketplace, du dashboard et des negociations.</p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => movePreview(-1)}
              aria-label="Apercu precedent"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/40 text-white transition hover:border-teal-300/40 hover:text-teal-200"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => movePreview(1)}
              aria-label="Apercu suivant"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/40 text-white transition hover:border-teal-300/40 hover:text-teal-200"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 hidden dashboard-scrollbar items-stretch gap-3 overflow-x-auto pb-1 sm:flex">
        {previewSlides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setActivePreview(index)}
            aria-label={`Aller a l'apercu ${index + 1}`}
            className={`flex h-[190px] w-[168px] shrink-0 flex-none flex-col overflow-hidden rounded-2xl border text-left transition ${
              index === activePreview ? "border-teal-300/60 bg-white/10" : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="relative aspect-[16/10] w-full flex-none bg-slate-900">
              <Image src={slide.src} alt={slide.alt} fill sizes="168px" className="object-cover" />
            </div>
            <div className="flex h-[84px] flex-col px-3 py-2 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Slide {index + 1}</p>
              <p className="mt-1 line-clamp-2 text-sm font-medium leading-5">{slide.title}</p>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}