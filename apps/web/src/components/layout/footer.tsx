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

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-slate-200 bg-[linear-gradient(180deg,rgba(236,254,255,0.45),#ffffff_38%,#ffffff)]">
      <div className="w-full px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-12 md:grid-cols-3 xl:grid-cols-5 xl:gap-x-10">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">{column.title}</h3>

              <div className="mt-5 space-y-4">
                {column.links.map((link) => (
                  <div key={`${column.title}-${link.label}-${link.href}`}>
                    <Link href={link.href} className="text-sm leading-6 text-slate-600 transition hover:text-slate-900">
                      {link.label}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-slate-200 pt-8">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">Dossiers et categories a suivre</h3>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {nicheLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-teal-300 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} OXLIS. Marketplace pour la transmission de business numeriques.</p>
          <p>Annonces, conversations, offres et sequestre simule dans un meme environnement.</p>
        </div>
      </div>
    </footer>
  );
}