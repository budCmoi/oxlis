"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatedSection } from "@/components/common/animated-section";
import { usePageTransitionRouter } from "@/components/common/page-transition-shell";
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
  const { push } = usePageTransitionRouter();
  const { isAuthenticated, user } = useAuth();
  const [listing, setListing] = useState<ListingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const loadListing = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoadError(null);
      const payload = await apiRequest<ListingWithDetails>(`/listings/${id}`, { signal });

      if (signal?.aborted) {
        return;
      }

      startTransition(() => {
        setListing(payload);
        setLoadError(null);
      });
    } catch (err) {
      if (isAbortError(err)) {
        return;
      }

      const nextMessage = err instanceof Error ? err.message : "Impossible de charger l'annonce";
      startTransition(() => {
        setListing(null);
        setLoadError(nextMessage);
      });
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    void loadListing(controller.signal);

    return () => controller.abort();
  }, [loadListing]);

  const submitOffer = async () => {
    if (!isAuthenticated) {
      await push(`/auth?next=${encodeURIComponent(`/listings/${id}`)}`);
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
      await push(`/auth?next=${encodeURIComponent(`/listings/${id}`)}`);
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
      await push(`/messages?conversation=${conversation.id}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Impossible de creer la conversation");
    }
  };

  if (isLoading && !listing) {
    return (
      <div className="page-shell px-4 py-5">
        <section className="studio-shell px-5 py-6 sm:px-6 sm:py-7">
          <p className="studio-kicker">Annonce</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">Chargement de l&apos;annonce...</p>
        </section>
      </div>
    );
  }

  if (loadError && !listing) {
    return (
      <div className="page-shell px-4 py-5">
        <section className="studio-shell px-5 py-6 sm:px-6 sm:py-7">
          <p className="studio-kicker">Annonce indisponible</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">Cette fiche n&apos;est plus accessible.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            {loadError.includes("introuvable")
              ? "Le lien pointe vers une annonce qui n'existe plus ou qui n'est plus publique."
              : loadError}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/" className="studio-button-primary text-sm">
              Retour aux annonces
            </Link>
            <Link href="/dashboard" className="studio-button-secondary text-sm">
              Aller au tableau de bord
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!listing) {
    return null;
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
    <div className="page-shell page-stack pt-4 sm:pt-6">
      <AnimatedSection
        as="section"
        className="studio-shell px-4 py-6 sm:px-6 sm:py-9 lg:px-8 lg:py-10"
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl" data-stagger-item>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600 sm:text-xs">
              <span>{listing.niche}</span>
              <span className="text-slate-400">•</span>
              <span>{listing.type}</span>
              <span className="text-slate-400">•</span>
              <span>{formatListingStatus(listing.status)}</span>
            </div>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 [overflow-wrap:anywhere] sm:text-5xl lg:text-6xl">{listing.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700 [overflow-wrap:anywhere] sm:text-base lg:text-lg">{listing.summary}</p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:gap-3 xl:max-w-[460px] xl:min-w-0">
            {heroMetrics.map((item) => (
              <div key={item.label} className="studio-stat" data-stagger-item>
                <p className="studio-kicker !text-[0.58rem] !tracking-[0.18em]">{item.label}</p>
                <p className="mt-3 text-base font-semibold text-slate-950 [overflow-wrap:anywhere] sm:text-lg">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection
        as="div"
        className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.82fr)] xl:items-start"
        delay={0.08}
      >
        <section className="studio-shell order-2 p-4 sm:p-6 xl:order-1">
          <div className="mb-6">
            <ListingGallery listing={listing} />
          </div>

          <div className="studio-panel px-4 py-4 sm:px-6 sm:py-6">
            <p className="studio-kicker">Memo de l&apos;annonce</p>
            <div className="mt-4 space-y-4 sm:max-h-[32rem] sm:overflow-y-auto sm:pr-3 sm:dashboard-scrollbar">
              {descriptionSections.map((section, index) => (
                <div key={`${listing.id}-description-${index}`}>
                  {section.heading ? <h2 className="text-lg font-semibold text-slate-950">{section.heading}</h2> : null}
                  <p className={`${section.heading ? "mt-2" : ""} text-sm leading-7 text-slate-700`}>{section.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:auto-rows-fr sm:grid-cols-2">
            {detailHighlights.map((item) => (
              <DetailCard key={item.label} label={item.label} value={item.value} description={item.description} />
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {listing.techStack.map((tech) => (
              <span key={tech} className="rounded-full border border-[var(--line)] bg-white/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                {tech}
              </span>
            ))}
          </div>
        </section>

        <aside className="order-1 space-y-4 xl:sticky xl:top-24 xl:order-2">
          <section className="studio-shell px-4 py-4 sm:px-5">
            <p className="studio-kicker">Execution acheteur</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">Faire une offre</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Vendeur : {listing.owner.name}</p>
            <input
              type="number"
              aria-label="Montant de l'offre"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              placeholder="Montant de l'offre"
              disabled={isOwner}
              className="mt-3 w-full px-4 py-3 text-sm"
            />
            <textarea
              aria-label="Note privee"
              value={offerMessage}
              onChange={(e) => setOfferMessage(e.target.value)}
              placeholder="Ajouter une note privee"
              rows={4}
              disabled={isOwner}
              className="mt-3 w-full px-4 py-3 text-sm"
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                onClick={submitOffer}
                data-testid="submit-offer"
                disabled={isOwner}
                className="studio-button-primary w-full text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAuthenticated ? "Envoyer l'offre" : "Se connecter pour proposer"}
              </button>
              <button
                onClick={createConversation}
                data-testid="contact-seller"
                disabled={isOwner}
                className="studio-button-secondary w-full text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Contacter le vendeur
              </button>
            </div>
            {isOwner ? <p className="mt-3 text-xs text-slate-500">Vous etes le proprietaire de cette annonce.</p> : null}
            {status ? <p className="mt-3 text-xs text-slate-600">{status}</p> : null}
          </section>

          <section className="studio-shell px-4 py-4 sm:px-5">
            <p className="studio-kicker">Pulse du dossier</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">Offres recentes</h2>
            <div className="mt-3 space-y-2">
              {listing.offers.slice(0, 5).map((offer) => (
                <div key={offer.id} className="rounded-[1.2rem] border border-[var(--line)] bg-white/60 px-3 py-3 text-sm">
                  <p className="font-semibold text-slate-800">{formatCurrency(offer.amount)}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">{formatOfferStatus(offer.status)}</p>
                </div>
              ))}
              {listing.offers.length === 0 ? <p className="text-sm text-slate-500">Aucune offre pour le moment.</p> : null}
            </div>
          </section>
        </aside>
      </AnimatedSection>
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
    <div className="studio-card px-4 py-4">
      <p className="studio-kicker !text-[0.62rem] !tracking-[0.18em]">{label}</p>
      <p className="mt-3 text-base font-semibold leading-6 text-slate-950 [overflow-wrap:anywhere] sm:text-lg">{value}</p>
      <p className="mt-3 text-[13px] leading-6 text-slate-600 sm:text-sm">{description}</p>
    </div>
  );
}
