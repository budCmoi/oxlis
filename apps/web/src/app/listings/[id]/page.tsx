"use client";

import { startTransition, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { useAuth } from "@/components/providers/auth-provider";
import { apiRequest, isAbortError } from "@/lib/api";
import { formatCurrency, formatListingStatus, formatOfferStatus } from "@/lib/format";
import { Listing, Offer } from "@/types";

type ListingWithDetails = Listing & {
  offers: Offer[];
  metrics: {
    margin: number;
    annualProfit: number;
    annualRevenue: number;
  };
};

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [listing, setListing] = useState<ListingWithDetails | null>(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const loadListing = async (signal?: AbortSignal) => {
    try {
      const payload = await apiRequest<ListingWithDetails>(`/listings/${id}`, { signal });

      if (signal?.aborted) {
        return;
      }

      startTransition(() => setListing(payload));
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }

      setStatus(err instanceof Error ? err.message : "Impossible de charger l'annonce");
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void loadListing(controller.signal);

    return () => controller.abort();
  }, [id]);

  const submitOffer = async () => {
    if (!isAuthenticated) {
      router.push(`/auth?next=${encodeURIComponent(`/listings/${id}`)}`);
      return;
    }

    setStatus(null);
    try {
      await apiRequest("/offers", {
        method: "POST",
        auth: true,
        body: {
          listingId: id,
          amount: Number(offerAmount),
          message: offerMessage,
        },
      });
      setStatus("Offre envoyee avec succes.");
      setOfferAmount("");
      setOfferMessage("");
      await loadListing();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Impossible d'envoyer l'offre");
    }
  };

  const createConversation = async () => {
    if (!listing) {
      return;
    }

    if (!isAuthenticated) {
      router.push(`/auth?next=${encodeURIComponent(`/listings/${id}`)}`);
      return;
    }

    try {
      const conversation = await apiRequest<{ id: string }>("/messages/conversations", {
        method: "POST",
        auth: true,
        body: {
          listingId: id,
          recipientId: listing.owner.id,
        },
      });
      router.push(`/messages?conversation=${conversation.id}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Impossible de creer la conversation");
    }
  };

  if (!listing) {
    return <p className="w-full px-4 py-10 text-sm text-slate-500 sm:px-5 lg:px-6">Chargement de l'annonce...</p>;
  }

  const isOwner = user?.id === listing.owner.id;
  const descriptionSections = listing.description
    .split("\n\n")
    .map((section) => section.trim())
    .filter(Boolean)
    .map((section) => {
      const [heading, ...bodyLines] = section.split("\n");
      const body = bodyLines.join(" ").trim();

      if (!body) {
        return { heading: null, body: heading.trim() };
      }

      return {
        heading: heading.trim(),
        body,
      };
    });
  const detailHighlights = [
    {
      label: "Positionnement",
      value: `${listing.niche} · ${listing.type}`,
      description: "Segment principal et angle de lecture rapide de l'actif.",
    },
    {
      label: "Vendeur",
      value: listing.owner.name,
      description: "Interlocuteur principal pour la due diligence et la transmission.",
    },
    {
      label: "Statut",
      value: formatListingStatus(listing.status),
      description: "Etat actuel de l'annonce dans le pipeline de transaction.",
    },
    {
      label: "Interet acheteur",
      value:
        listing.offers.length === 0
          ? "Aucune offre ouverte"
          : `${listing.offers.length} offre${listing.offers.length > 1 ? "s" : ""} en cours`,
      description:
        listing.offers.length === 0
          ? "Le dossier est encore ouvert aux premiers acheteurs qualifies."
          : "Des acheteurs ont deja manifeste un interet actif sur ce dossier.",
    },
    {
      label: "Rentabilite",
      value: `Marge nette ${listing.metrics.margin.toFixed(1)} %`,
      description: "Lecture rapide de la qualite des revenus sans dupliquer les prix de l'image.",
    },
    {
      label: "Lecture rapide",
      value: listing.summary,
      description: "Resume synthetique du business et de sa proposition de valeur.",
    },
  ];
  const heroMetrics = [
    {
      label: "Prix demande",
      value: formatCurrency(listing.askingPrice),
    },
    {
      label: "CA mensuel",
      value: `${formatCurrency(listing.monthlyRevenue)}/mo`,
    },
    {
      label: "Profit mensuel",
      value: `${formatCurrency(listing.monthlyProfit)}/mo`,
    },
    {
      label: "Marge nette",
      value: `${listing.metrics.margin.toFixed(1)} %`,
    },
  ];

  return (
    <div className="w-full px-4 py-5 sm:px-5 sm:py-6 lg:px-6">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_right,#99f6e4,transparent_50%),linear-gradient(120deg,#f8fafc,#ecfeff_45%,#fefce8)] px-5 py-8 sm:px-6 sm:py-9 lg:px-8 lg:py-10"
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
              <span>{listing.niche}</span>
              <span className="text-slate-400">•</span>
              <span>{listing.type}</span>
              <span className="text-slate-400">•</span>
              <span>{formatListingStatus(listing.status)}</span>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">{listing.title}</h1>
            <p className="mt-4 text-base text-slate-700 sm:text-lg">{listing.summary}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[460px]">
            {heroMetrics.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{item.label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="mt-4 grid gap-4 sm:mt-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.82fr)] xl:items-start">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6">
            <ListingGallery listing={listing} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Memo de l'annonce</p>
            <div className="mt-4 space-y-4">
              {descriptionSections.map((section, index) => (
                <div key={`${listing.id}-description-${index}`}>
                  {section.heading ? <h2 className="text-sm font-semibold text-slate-900">{section.heading}</h2> : null}
                  <p className={`${section.heading ? "mt-2" : ""} text-sm leading-7 text-slate-700`}>{section.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:auto-rows-fr sm:grid-cols-2">
            {detailHighlights.map((item) => (
              <DetailCard key={item.label} label={item.label} value={item.value} description={item.description} />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {listing.techStack.map((tech) => (
              <span key={tech} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {tech}
              </span>
            ))}
          </div>
        </section>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Faire une offre</h2>
            <p className="mt-1 text-sm text-slate-600">Vendeur : {listing.owner.name}</p>
            <input
              type="number"
              aria-label="Montant de l'offre"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              placeholder="Montant de l'offre"
              disabled={isOwner}
              className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
            />
            <textarea
              aria-label="Note privee"
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
              placeholder="Ajouter une note privee"
              rows={4}
              disabled={isOwner}
              className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                onClick={submitOffer}
                data-testid="submit-offer"
                disabled={isOwner}
                className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAuthenticated ? "Envoyer l'offre" : "Connectez-vous pour proposer"}
              </button>
              <button
                onClick={createConversation}
                data-testid="contact-seller"
                disabled={isOwner}
                className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Contacter le vendeur
              </button>
            </div>
            {isOwner ? <p className="mt-3 text-xs text-slate-500">Vous etes le proprietaire de cette annonce.</p> : null}
            {status ? <p className="mt-3 text-xs text-slate-600">{status}</p> : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Offres recentes</h2>
            <div className="mt-3 space-y-2">
              {listing.offers.slice(0, 5).map((offer) => (
                <div key={offer.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-semibold text-slate-800">{formatCurrency(offer.amount)}</p>
                  <p className="text-xs uppercase tracking-[0.1em] text-slate-500">{formatOfferStatus(offer.status)}</p>
                </div>
              ))}
              {listing.offers.length === 0 ? <p className="text-sm text-slate-500">Aucune offre pour le moment.</p> : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DetailCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex h-full min-h-[172px] flex-col rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-base font-semibold leading-6 text-slate-900">{value}</p>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
