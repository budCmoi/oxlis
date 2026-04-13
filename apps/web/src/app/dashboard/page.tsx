"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, Handshake, Inbox, LayoutDashboard } from "lucide-react";
import { RequireAuth } from "@/components/auth/require-auth";
import { ListingManagementCard } from "@/components/dashboard/listing-management-card";
import { OfferCard } from "@/components/dashboard/offer-card";
import { Panel } from "@/components/dashboard/panel";
import { StatCard } from "@/components/dashboard/stat-card";
import { apiRequest } from "@/lib/api";
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

  const loadDashboard = async () => {
    setError(null);

    try {
      const payload = await apiRequest<DashboardPayload>("/dashboard", { auth: true });
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger le tableau de bord");
    }
  };

  useEffect(() => {
    void loadDashboard();
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
    return <p className="mx-auto max-w-6xl px-4 py-10 text-sm text-red-700">{error}</p>;
  }

  if (!data) {
    return <p className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500">Chargement du tableau de bord...</p>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-slate-600">Gerez vos annonces, negociez les offres et faites progresser les transactions via le sequestre.</p>
        </div>
        <Link
          href="/sell"
          className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600"
        >
          Creer une annonce
        </Link>
      </div>

      {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Annonces actives" value={data.stats.activeListings} icon={<LayoutDashboard className="h-4 w-4" />} />
        <StatCard label="Offres recues" value={data.stats.offersReceived} icon={<Handshake className="h-4 w-4" />} />
        <StatCard label="Offres envoyees" value={data.stats.offersMade} icon={<FileText className="h-4 w-4" />} />
        <StatCard label="Conversations" value={data.stats.openConversations} icon={<Inbox className="h-4 w-4" />} />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr,1fr]">
        <Panel title="Mes annonces" subtitle="Suivez vos prix demandes et l'activite entrante.">
          {data.listings.map((listing) => (
            <ListingManagementCard
              key={listing.id}
              listing={listing}
              busy={busyKey === `listing-${listing.id}`}
              onDelete={() =>
                runAction(`listing-${listing.id}`, () =>
                  apiRequest(`/listings/${listing.id}`, {
                    method: "DELETE",
                    auth: true,
                  }),
                )
              }
            />
          ))}
          {data.listings.length === 0 ? <p className="text-sm text-slate-500">Aucune annonce pour le moment.</p> : null}
        </Panel>

        <Panel title="Offres recues" subtitle="Acceptez, refusez ou contrez les offres entrantes.">
          {data.offersReceived.map((offer) => (
            <OfferCard
              key={offer.id}
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
          ))}
          {data.offersReceived.length === 0 ? <p className="text-sm text-slate-500">Aucune offre recue.</p> : null}
        </Panel>
      </section>

      <section className="mt-4">
        <Panel title="Offres envoyees" subtitle="Suivez les offres acceptees et finalisez le financement.">
          <div className="grid gap-3 lg:grid-cols-2">
            {data.offersMade.map((offer) => (
              <OfferCard
                key={offer.id}
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
            ))}
          </div>
          {data.offersMade.length === 0 ? <p className="text-sm text-slate-500">Aucune offre envoyee pour le moment.</p> : null}
        </Panel>
      </section>
    </div>
  );
}
