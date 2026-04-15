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
    return <p className="page-shell px-4 py-10 text-sm text-slate-500">Chargement du tableau de bord...</p>;
  }

  return (
    <div className="page-shell page-stack pt-4 sm:pt-6">
      <AnimatedSection
        as="section"
        className="studio-shell px-5 py-6 sm:px-8 sm:py-8 lg:px-10"
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl" data-stagger-item>
            <p className="studio-kicker">Pilotage vendeur et deal flow</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">Tableau de bord des annonces, offres et transactions.</h1>
            <p className="mt-4 text-sm leading-7 text-slate-700 sm:text-base lg:text-lg">
              Suivez vos actifs en temps reel, pilotez les discussions acheteurs et faites progresser chaque deal jusqu&apos;au sequestre.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:justify-end">
            <div className="studio-stat" data-stagger-item>
              <p className="studio-kicker !text-[0.62rem] !tracking-[0.18em]">Activite</p>
              <p className="mt-3 text-lg font-semibold text-slate-950">{data.stats.activeListings} actifs en ligne</p>
            </div>
            <div className="studio-stat" data-stagger-item>
              <p className="studio-kicker !text-[0.62rem] !tracking-[0.18em]">Pipeline</p>
              <p className="mt-3 text-lg font-semibold text-slate-950">{data.stats.offersReceived} offres recues</p>
            </div>
            <Link
              href="/sell"
              className="studio-button-primary text-sm"
              data-stagger-item
            >
              Creer une annonce
            </Link>
          </div>
        </div>
      </AnimatedSection>

      {error ? <p className="rounded-[1.4rem] border border-rose-200 bg-rose-50/80 px-4 py-4 text-sm text-rose-700">{error}</p> : null}

      <AnimatedSection as="section" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" delay={0.08}>
        <StatCard label="Annonces actives" value={data.stats.activeListings} icon={<LayoutDashboard className="h-4 w-4" />} />
        <StatCard label="Offres recues" value={data.stats.offersReceived} icon={<Handshake className="h-4 w-4" />} />
        <StatCard label="Offres envoyees" value={data.stats.offersMade} icon={<FileText className="h-4 w-4" />} />
        <StatCard label="Conversations" value={data.stats.openConversations} icon={<Inbox className="h-4 w-4" />} />
      </AnimatedSection>

      <AnimatedSection as="section" delay={0.14}>
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

      <AnimatedSection as="section" className="grid gap-4 md:grid-cols-2 md:items-start" delay={0.2}>
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
