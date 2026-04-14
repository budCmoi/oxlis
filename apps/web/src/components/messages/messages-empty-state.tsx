"use client";

import Image from "next/image";
import Link from "next/link";

const rotatingQuotes = [
  {
    quote: "Un bon produit n'attend pas l'utilisateur, il lui montre la prochaine action utile.",
    author: "Proverbe de dev produit",
  },
  {
    quote: "Une interface vide doit rassurer, orienter et donner envie du prochain clic.",
    author: "Proverbe de dev front",
  },
  {
    quote: "Le meilleur fil commence souvent par une question simple et un contexte clair.",
    author: "Proverbe de builder",
  },
  {
    quote: "Quand l'etat vide raconte une histoire, l'utilisateur comprend deja le workflow.",
    author: "Proverbe UX engineering",
  },
] as const;

const tickerQuotes = [
  "Ship > perfect",
  "Le contexte vend mieux que le bruit",
  "Un bon message debloque un deal",
  "Le produit doit expliquer l'action suivante",
  "Une UI vide ne doit jamais etre une impasse",
  "Le detail cree la confiance",
] as const;

const onboardingSteps = [
  "Un acheteur ouvre une annonce et clique sur Contacter le vendeur.",
  "OXLIS cree automatiquement un fil prive entre les deux parties.",
  "Le fil apparait ici avec l'historique des messages et le contexte du deal.",
] as const;

export function MessagesEmptyState() {
  const featuredQuote = rotatingQuotes[0];

  return (
    <section className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm sm:mt-5">
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Messagerie en attente</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Aucun fil actif pour le moment.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Ici, un fil correspond a une conversation privee entre un acheteur et un vendeur. Tant que personne n&apos;a clique sur
            Contacter le vendeur depuis une annonce, cette page reste vide. Au lieu de laisser un trou, on vous montre le fonctionnement.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {onboardingSteps.map((step, index) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Etape {index + 1}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{step}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-600"
            >
              Explorer les annonces
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Retour au dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_right,#99f6e4,transparent_55%),linear-gradient(145deg,#f8fafc,#ecfeff_52%,#ffffff)] p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <VisualCard imageSrc="/preview-marketplace.svg" title="Marketplace" caption="La conversation nait depuis une fiche annonce." />
            <VisualCard imageSrc="/preview-messages.svg" title="Messagerie" caption="Le fil regroupe contexte, echanges et suivi." />
            <VisualCard imageSrc="/preview-dashboard.svg" title="Dashboard" caption="Les discussions alimentent ensuite vos offres et vos statuts." wide />
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Proverbes qui defilent</p>

            <div className="mt-4 min-h-[122px]">
              <blockquote className="flex min-h-[122px] flex-col justify-center">
                <p className="text-lg font-semibold leading-8 text-slate-900">“{featuredQuote.quote}”</p>
                <footer className="mt-3 text-sm text-slate-500">{featuredQuote.author}</footer>
              </blockquote>
            </div>

            <div className="mt-4 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
              <div className="flex flex-wrap gap-2 px-2 py-2">
                {tickerQuotes.map((quote, index) => (
                  <span key={`${quote}-${index}`} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                    {quote}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VisualCard({
  imageSrc,
  title,
  caption,
  wide = false,
}: {
  imageSrc: string;
  title: string;
  caption: string;
  wide?: boolean;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${wide ? "sm:col-span-2" : ""}`}>
      <div className="relative aspect-[16/10] bg-slate-900">
        <Image src={imageSrc} alt={title} fill sizes="(max-width: 1024px) 100vw, 360px" className="object-cover" />
      </div>
      <div className="px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{caption}</p>
      </div>
    </div>
  );
}