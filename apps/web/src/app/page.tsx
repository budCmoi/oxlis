"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { FilterBar, Filters } from "@/components/listings/filter-bar";
import { ListingCard } from "@/components/listings/listing-card";
import { apiRequest, isAbortError } from "@/lib/api";
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

  const fetchListings = async () => {
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
  };

  useEffect(() => {
    void fetchListings();

    return () => {
      requestRef.current?.abort();
    };
  }, []);

  return (
    <div className="w-full px-4 py-5 sm:px-5 sm:py-6 lg:px-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_right,#99f6e4,transparent_50%),linear-gradient(120deg,#f8fafc,#ecfeff_45%,#fefce8)] px-5 py-8 sm:px-6 sm:py-9 lg:px-8 lg:py-11">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Plateforme d&apos;acquisition digitale</p>
          <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Achetez et vendez des entreprises numeriques rentables en toute confiance.
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-700 sm:text-base lg:text-lg">
            Decouvrez des SaaS, e-commerces et medias selectionnes. Negociez via la messagerie integree,
            envoyez des offres et finalisez via une simulation de sequestre.
          </p>
        </div>
      </section>

      <div className="mt-4 sm:mt-5">
        <FilterBar filters={filters} setFilters={setFilters} onApply={fetchListings} />
      </div>

      {loading ? <p className="mt-4 sm:mt-5 text-sm text-slate-500">Chargement des annonces...</p> : null}
      {error ? <p className="mt-4 sm:mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section className="mt-4 grid gap-4 sm:mt-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {listings.map((listing) => (
          <div key={listing.id} className="h-full min-w-0">
            <ListingCard listing={listing} />
          </div>
        ))}
      </section>

      {!loading && listings.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-600">
          Aucune annonce ne correspond a vos filtres pour le moment.
        </p>
      ) : null}
    </div>
  );
}
