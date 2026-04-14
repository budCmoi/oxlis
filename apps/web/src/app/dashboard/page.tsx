"use client";

import Link from "next/link";
import { startTransition, useEffect, useRef, useState } from "react";
import { FileText, Handshake, Inbox, LayoutDashboard } from "lucide-react";
import { RequireAuth } from "@/components/auth/require-auth";
import { AnimatedSection } from "@/components/common/animated-section";
import { ListingsRail } from "@/components/dashboard/listings-rail";
import { OfferCard } from "@/components/dashboard/offer-card";
import { Panel } from "@/components/dashboard/panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiRequest, isAbortError } from "@/lib/api";
import { Offer } from "@/types";

type DashboardListing = {
  id: string;
  title: string;
  askingPrice: number;
  status: string;
  _count: { offers: number };
};

type DashboardPayload = {
  stats: {
    activeListings: number;
    totalListingViewsProxy: number;
    offersReceived: number;
    offersMade: number;
    openConversations: number;
  };
  listings: DashboardListing[];
  offersReceived: Offer[];
  offersMade: Offer[];
};

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const loadDashboard = async (signal?: AbortSignal) => {
    setError(null);

    try {
      const payload = await apiRequest<DashboardPayload>("/dashboard", { auth: true, signal });

      if (signal?.aborted) {
        return;
      }

      startTransition(() => setData(payload));
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }

      setError(err instanceof Error ? err.message : "Impossible de charger le tableau de bord");
    }
  };

  useEffect(() => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    void loadDashboard(controller.signal);

    return () => {
      controller.abort();
      if (requestRef.current === controller) {
        requestRef.current = null;
      }
    };
  }, []);

  const runAction = async (key: string, action: () => Promise<unknown>) => {
    setBusyKey(key);
    setError(null);

    try {
      await action();
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Echec de l'action");
    } finally {
      setBusyKey(null);
    }
  };

  if (error && !data) {
    return <p className="w-full px-4 py-10 text-sm text-red-700 sm:px-5 lg:px-6">{error}</p>;
  }

  if (!data) {
    return <p className="w-full px-4 py-10 text-sm text-slate-500 sm:px-5 lg:px-6">Chargement du tableau de bord...</p>;
  }

  return (
    <div className="w-full px-4 py-5 sm:px-5 sm:py-6 lg:px-6">
      <AnimatedSection
        as="section"
        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_right,#99f6e4,transparent_50%),linear-gradient(120deg,#f8fafc,#ecfeff_45%,#fefce8)] px-5 py-8 sm:px-6 sm:py-9 lg:px-8 lg:py-10"
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Pilotage vendeur et deal flow</p>
            <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">Tableau de bord des annonces, offres et transactions.</h1>
            <p className="mt-4 text-sm leading-6 text-slate-700 sm:text-base lg:text-lg">
              Suivez vos actifs en temps reel, pilotez les discussions acheteurs et faites progresser chaque deal jusqu&apos;au sequestre.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
            <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Activite</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{data.stats.activeListings} actifs en ligne</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Pipeline</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{data.stats.offersReceived} offres recues</p>
            </div>
            <Link
              href="/sell"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-600"
            >
              Creer une annonce
            </Link>
          </div>
        </div>
      </AnimatedSection>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <AnimatedSection as="section" className="mt-4 grid gap-4 sm:mt-5 sm:grid-cols-2 lg:grid-cols-4" delay={0.08}>
        <StatCard label="Annonces actives" value={data.stats.activeListings} icon={<LayoutDashboard className="h-4 w-4" />} />
        <StatCard label="Offres recues" value={data.stats.offersReceived} icon={<Handshake className="h-4 w-4" />} />
        <StatCard label="Offres envoyees" value={data.stats.offersMade} icon={<FileText className="h-4 w-4" />} />
        <StatCard label="Conversations" value={data.stats.openConversations} icon={<Inbox className="h-4 w-4" />} />
      </AnimatedSection>

      <AnimatedSection as="section" className="mt-5" delay={0.14}>
        <Panel title="Mes annonces" subtitle="Faites glisser horizontalement vos annonces ou utilisez les fleches pour boucler dans le rail.">
          <ListingsRail
            listings={data.listings}
            busyKey={busyKey}
            onDelete={(listingId) =>
              runAction(`listing-${listingId}`, () =>
                apiRequest(`/listings/${listingId}`, {
                  method: "DELETE",
                  auth: true,
                }),
              )
            }
          />
        </Panel>
      </AnimatedSection>

      <AnimatedSection as="section" className="mt-4 grid gap-4 md:grid-cols-2 md:items-start" delay={0.2}>
        <Panel
          title="Offres recues"
          subtitle="Acceptez, refusez ou contrez les offres entrantes."
          className="h-full"
          contentClassName="max-h-[640px] overflow-y-auto pr-1 dashboard-scrollbar snap-y snap-mandatory scroll-smooth overscroll-y-contain"
        >
          {data.offersReceived.map((offer) => (
            <div key={offer.id} className="snap-start">
              <OfferCard
                offer={offer}
                busy={busyKey === offer.id}
                primaryAction={
                  offer.status !== "ACCEPTED"
                    ? {
                        label: "Accepter",
                        onClick: () =>
                          runAction(offer.id, () =>
                            apiRequest(`/offers/${offer.id}/status`, {
                              method: "PATCH",
                              auth: true,
                              body: { status: "ACCEPTED" },
                            }),
                          ),
                      }
                    : undefined
                }
                secondaryAction={
                  offer.status === "PENDING" || offer.status === "COUNTERED"
                    ? {
                        label: "Refuser",
                        onClick: () =>
                          runAction(offer.id, () =>
                            apiRequest(`/offers/${offer.id}/status`, {
                              method: "PATCH",
                              auth: true,
                              body: { status: "REJECTED" },
                            }),
                          ),
                      }
                    : undefined
                }
                tertiaryAction={
                  offer.status === "PENDING"
                    ? {
                        label: "Contre-offre",
                        onClick: () =>
                          runAction(offer.id, () =>
                            apiRequest(`/offers/${offer.id}/status`, {
                              method: "PATCH",
                              auth: true,
                              body: { status: "COUNTERED" },
                            }),
                          ),
                      }
                    : offer.status === "ACCEPTED" && offer.escrow?.status === "FUNDED"
                      ? {
                          label: "Liberer le sequestre",
                          onClick: () =>
                            runAction(offer.id, () =>
                              apiRequest(`/escrow/offers/${offer.id}/release`, {
                                method: "POST",
                                auth: true,
                              }),
                            ),
                        }
                      : undefined
                }
              />
            </div>
          ))}
          {data.offersReceived.length === 0 ? <p className="text-sm text-slate-500">Aucune offre recue.</p> : null}
        </Panel>

        <Panel
          title="Offres envoyees"
          subtitle="Suivez les offres acceptees et finalisez le financement."
          className="h-full"
          contentClassName="max-h-[640px] overflow-y-auto pr-1 dashboard-scrollbar snap-y snap-mandatory scroll-smooth overscroll-y-contain"
        >
          {data.offersMade.map((offer) => (
            <div key={offer.id} className="snap-start">
              <OfferCard
                offer={offer}
                busy={busyKey === `${offer.id}-fund`}
                primaryAction={
                  offer.status === "ACCEPTED" && offer.escrow?.status === "INITIATED"
                    ? {
                        label: "Financer le sequestre",
                        onClick: () =>
                          runAction(`${offer.id}-fund`, () =>
                            apiRequest(`/escrow/offers/${offer.id}/fund`, {
                              method: "POST",
                              auth: true,
                            }),
                          ),
                      }
                    : undefined
                }
              />
            </div>
          ))}
          {data.offersMade.length === 0 ? <p className="text-sm text-slate-500">Aucune offre envoyee pour le moment.</p> : null}
        </Panel>
      </AnimatedSection>
    </div>
  );
}
