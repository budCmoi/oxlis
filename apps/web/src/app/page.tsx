"use client";

import Link from "next/link";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { AnimatedSection } from "@/components/common/animated-section";
import { FilterBar, Filters } from "@/components/listings/filter-bar";
import { ListingCard } from "@/components/listings/listing-card";
import { apiRequest, isAbortError } from "@/lib/api";
import { formatCompact, formatCurrency } from "@/lib/format";
import { Listing } from "@/types";

const defaultFilters: Filters = {
  priceMin: "",
  priceMax: "",
  niche: "",
  type: "",
};

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.priceMin) params.set("priceMin", filters.priceMin);
    if (filters.priceMax) params.set("priceMax", filters.priceMax);
    if (filters.niche) params.set("niche", filters.niche);
    if (filters.type) params.set("type", filters.type);
    return params.toString();
  }, [filters]);

  const marketSnapshot = useMemo(() => {
    const totalListings = listings.length;
    const totalAsking = listings.reduce((sum, listing) => sum + listing.askingPrice, 0);
    const averageTicket = totalListings > 0 ? totalAsking / totalListings : 0;
    const averageMargin =
      totalListings > 0
        ? listings.reduce((sum, listing) => {
            if (!listing.monthlyRevenue) {
              return sum;
            }

            return sum + (listing.monthlyProfit / listing.monthlyRevenue) * 100;
          }, 0) / totalListings
        : 0;

    const nicheCounts = listings.reduce<Record<string, number>>((accumulator, listing) => {
      accumulator[listing.niche] = (accumulator[listing.niche] ?? 0) + 1;
      return accumulator;
    }, {});

    const topNiche = Object.entries(nicheCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "Curated";

    return [
      {
        label: "Dossiers live",
        value: totalListings > 0 ? formatCompact(totalListings) : "00",
        note: "actifs visibles",
      },
      {
        label: "Ticket moyen",
        value: totalListings > 0 ? formatCurrency(Math.round(averageTicket)) : "--",
        note: "sur la vitrine",
      },
      {
        label: "Marge moyenne",
        value: totalListings > 0 ? `${averageMargin.toFixed(1)} %` : "--",
        note: topNiche,
      },
    ];
  }, [listings]);

  const featuredListings = listings.slice(0, 3);

  const fetchListings = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest<Listing[]>(`/listings${queryString ? `?${queryString}` : ""}`, {
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      startTransition(() => setListings(data));
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }

      setError(err instanceof Error ? err.message : "Impossible de charger les annonces");
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
      }

      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [queryString]);

  useEffect(() => {
    void fetchListings();

    return () => {
      requestRef.current?.abort();
    };
  }, [fetchListings]);

  return (
    <div className="page-shell page-stack pt-4 sm:pt-6">
      <AnimatedSection
        as="section"
        className="studio-shell min-h-[76svh] px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10"
      >
        <div className="grid gap-6 lg:min-h-[calc(76svh-2rem)] lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)] lg:items-end">
          <div className="flex flex-col justify-between gap-8">
            <div className="space-y-6">
              <div data-stagger-item>
                <p className="studio-kicker">
                  <Sparkles className="h-3.5 w-3.5" />
                  Plateforme d&apos;acquisition digitale
                </p>
              </div>

              <div data-stagger-item>
                <h1 className="studio-display max-w-4xl text-slate-950">
                  Achetez et vendez des entreprises numeriques avec une interface digne d&apos;un vrai deal flow premium.
                </h1>
              </div>

              <p data-stagger-item className="studio-copy">
                Decouvrez des SaaS, e-commerces, medias et apps mobiles, negociez depuis la messagerie integree,
                structurez vos offres et accompagnez chaque transaction jusqu&apos;a la simulation de sequestre.
              </p>

              <div data-stagger-item className="flex flex-wrap gap-3">
                <Link href="/sell" className="studio-button-primary text-sm sm:text-base">
                  Publier un actif
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <a href="#market-feed" className="studio-button-secondary text-sm sm:text-base">
                  Explorer les dossiers
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {marketSnapshot.map((item) => (
                <div key={item.label} data-stagger-item className="studio-stat">
                  <p className="studio-kicker !text-[0.62rem] !tracking-[0.18em]">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-3xl">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 lg:gap-4">
            <div data-stagger-item className="studio-panel-dark rounded-[1.8rem] px-5 py-5 sm:px-6">
              <p className="studio-kicker !text-lime-200/70">Selection curatee</p>
              <p className="mt-4 text-3xl font-semibold leading-tight text-white">
                Un marketplace fluide, plus editoriale, pense pour inspirer confiance avant la due diligence.
              </p>
              <p className="mt-3 text-sm leading-6 text-white/68">
                Le design met en avant les actifs, les indicateurs clefs et les prochaines actions, sans toucher a la logique backend existante.
              </p>
            </div>

            {featuredListings.length > 0 ? (
              featuredListings.map((listing) => (
                <div key={listing.id} data-stagger-item className="studio-card px-4 py-4 sm:px-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="studio-kicker !text-[0.6rem] !tracking-[0.18em]">{listing.niche}</p>
                      <p className="mt-2 truncate text-xl font-semibold text-slate-950">{listing.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{listing.summary}</p>
                    </div>
                    <span className="studio-pill shrink-0">{formatCurrency(listing.askingPrice)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div data-stagger-item className="studio-card px-5 py-6 text-sm text-slate-600">
                Les dossiers curates apparaitront ici une fois le flux d&apos;annonces charge.
              </div>
            )}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection as="section" className="grid gap-4 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]" delay={0.08}>
        <div className="studio-panel flex flex-col justify-between gap-5 px-5 py-5 sm:px-6">
          <div>
            <p className="studio-kicker">Recherche dirigee</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              Filtrez les actifs comme un investisseur qui veut aller vite.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Ajustez le ticket d&apos;entree, la niche ou le type d&apos;actif, puis relancez la selection sans quitter la page.
            </p>
          </div>

          <div className="rounded-[1.4rem] border border-[var(--line)] bg-white/55 px-4 py-4 text-sm text-slate-600">
            Les filtres conservent les memes appels API et la meme structure de donnees. Seule la presentation evolue.
          </div>
        </div>

        <FilterBar filters={filters} setFilters={setFilters} onApply={fetchListings} />
      </AnimatedSection>

      {loading ? <p className="rounded-[1.4rem] border border-[var(--line)] bg-white/60 px-4 py-4 text-sm text-slate-500">Chargement des annonces...</p> : null}
      {error ? <p className="rounded-[1.4rem] border border-rose-200 bg-rose-50/80 px-4 py-4 text-sm text-rose-700">{error}</p> : null}

      <AnimatedSection as="section" className="space-y-4" delay={0.14}>
        <div id="market-feed" className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="studio-kicker">Flux du marketplace</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Des dossiers structures pour lecture rapide, comparaison et prise de contact.</h2>
          </div>
          <span className="studio-pill self-start sm:self-auto">{listings.length} dossiers visibles</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {listings.map((listing) => (
            <div key={listing.id} className="h-full min-w-0">
              <ListingCard listing={listing} />
            </div>
          ))}
        </div>
      </AnimatedSection>

      {!loading && listings.length === 0 ? (
        <p className="rounded-[1.75rem] border border-dashed border-[var(--line)] bg-white/60 px-4 py-8 text-center text-sm text-slate-600">
          Aucune annonce ne correspond a vos filtres pour le moment.
        </p>
      ) : null}
    </div>
  );
}
