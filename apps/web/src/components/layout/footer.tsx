import Link from "next/link";

const footerColumns = [
  {
    title: "Acheter",
    links: [
      { label: "Explorer le marketplace", href: "/" },
      { label: "AI SaaS premium", href: "/listings/promptloop-ai" },
      { label: "E-commerce rentable", href: "/listings/northstar-gear" },
      { label: "Media et audience", href: "/listings/finscope-media" },
      { label: "Developer tools", href: "/listings/stacklane-observability" },
    ],
  },
  {
    title: "Vendre",
    links: [
      { label: "Publier une annonce", href: "/sell" },
      { label: "Creer un compte vendeur", href: "/auth?next=%2Fsell" },
      { label: "Suivre vos offres", href: "/dashboard" },
      { label: "Echanger avec les acheteurs", href: "/messages" },
      { label: "Piloter vos actifs", href: "/dashboard" },
    ],
  },
  {
    title: "Plateforme",
    links: [
      { label: "Connexion", href: "/auth" },
      { label: "Tableau de bord", href: "/dashboard" },
      { label: "Messagerie integree", href: "/messages" },
      { label: "Demarrer un deal", href: "/auth?next=%2Fdashboard" },
      { label: "Vendre maintenant", href: "/sell" },
    ],
  },
  {
    title: "Dossiers en vedette",
    links: [
      { label: "NeuralOps Copilot", href: "/listings/neuralops-copilot" },
      { label: "BlockForge Analytics", href: "/listings/blockforge-analytics" },
      { label: "MentorGrid Campus", href: "/listings/mentorgrid-campus" },
      { label: "FlexPulse Coach", href: "/listings/flexpulse-coach" },
      { label: "QuestLoop Studios", href: "/listings/questloop-studios" },
    ],
  },
  {
    title: "Niches actives",
    links: [
      { label: "Mobile App", href: "/listings/pulsepath-mobile" },
      { label: "Crypto / Web3", href: "/listings/blockforge-analytics" },
      { label: "Gaming", href: "/listings/questloop-studios" },
      { label: "Education Platform", href: "/listings/mentorgrid-campus" },
      { label: "Health / Fitness", href: "/listings/flexpulse-coach" },
    ],
  },
] as const;

const nicheLinks = [
  { label: "AI SaaS", href: "/listings/neuralops-copilot" },
  { label: "Mobile App", href: "/listings/pulsepath-mobile" },
  { label: "Crypto / Web3", href: "/listings/blockforge-analytics" },
  { label: "Gaming", href: "/listings/questloop-studios" },
  { label: "Education Platform", href: "/listings/mentorgrid-campus" },
  { label: "Health / Fitness", href: "/listings/flexpulse-coach" },
  { label: "Developer Tools", href: "/listings/stacklane-observability" },
  { label: "Finance Media", href: "/listings/finscope-media" },
  { label: "Outdoor Commerce", href: "/listings/northstar-gear" },
  { label: "Workflow SaaS", href: "/listings/promptloop-ai" },
] as const;

const mobileNicheLinks = nicheLinks.slice(0, 6);

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="page-shell mt-10 pb-6 pt-6 md:mt-14 md:pb-8">
      <div data-page-enter className="studio-shell px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
          <div>
            <p className="studio-kicker">Marketplace editoriale</p>
            <h2 className="studio-display mt-4 max-w-3xl text-[clamp(2.6rem,6vw,5.3rem)] text-slate-950">
              Une plateforme de transmission digitale pensée comme un portfolio vivant.
            </h2>
            <p className="studio-copy mt-5 max-w-2xl">
              OXLIS connecte annonces, messagerie, offres et execution vendeur dans une experience plus fluide,
              plus lisible et plus haut de gamme, sans changer la logique métier de l’application.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {mobileNicheLinks.map((item) => (
                <Link key={item.href} href={item.href} className="studio-pill hover:-translate-y-0.5 hover:bg-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title} className="studio-card px-4 py-4 sm:px-5">
                <h3 className="text-lg font-semibold text-slate-950">{column.title}</h3>
                <div className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <div key={`${column.title}-${link.label}-${link.href}`}>
                      <Link href={link.href} className="text-sm leading-6 text-slate-600 hover:text-slate-950">
                        {link.label}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="studio-divider mt-8" />

        <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="flex flex-wrap gap-2.5">
            {nicheLinks.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-full border border-[var(--line)] bg-white/60 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950">
                {item.label}
              </Link>
            ))}
          </div>

          <div className="text-xs leading-6 text-slate-500 md:text-right">
            <p>© {year} OXLIS. Marketplace pour la transmission de business numeriques.</p>
            <p>Annonces, conversations, offres et sequestre simule dans un meme environnement.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}