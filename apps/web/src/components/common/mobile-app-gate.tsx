import { ArrowUpRight, Monitor, ShieldCheck, Smartphone, Sparkles } from "lucide-react";

const storeLinks = [
  {
    label: "App Store",
    href: "https://apps.apple.com/",
    caption: "Tester l'experience mobile sur iPhone",
  },
  {
    label: "Google Play",
    href: "https://play.google.com/store",
    caption: "Installer l'application Android",
  },
];

const highlights = [
  {
    icon: <Monitor className="h-4 w-4" />,
    title: "Version web uniquement",
    text: "Le site OXLIS s'utilise sur grand ecran a partir de 1000 px pour garder une navigation propre sur les annonces, offres et discussions.",
  },
  {
    icon: <Smartphone className="h-4 w-4" />,
    title: "Version mobile via app",
    text: "Pour tester l'experience mobile, passez par notre application iOS ou Android depuis les stores ci-dessous.",
  },
  {
    icon: <ShieldCheck className="h-4 w-4" />,
    title: "Meme experience de test",
    text: "Retrouvez les annonces, les offres, la messagerie et le suivi des deals dans un parcours mobile dedie.",
  },
];

export function MobileAppGate() {
  return (
    <div className="mobile-app-gate relative h-full min-h-full overflow-x-hidden overflow-y-auto bg-[linear-gradient(160deg,#020617,#0f172a_45%,#042f2e)] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="mobile-gate-orb mobile-gate-orb-one" />
        <div className="mobile-gate-orb mobile-gate-orb-two" />
        <div className="mobile-gate-grid absolute inset-0 opacity-30" />
      </div>

      <div className="relative z-10 flex min-h-full flex-col px-4 py-4 min-[600px]:px-5 min-[600px]:py-5 min-[800px]:px-6 min-[800px]:py-6">
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-1 flex-col">
          <div className="flex min-h-full flex-1 flex-col rounded-[2rem] border border-white/15 bg-white/8 p-4 shadow-[0_30px_120px_-55px_rgba(45,212,191,0.55)] backdrop-blur-xl min-[600px]:p-5 min-[800px]:p-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-200">
              <Sparkles className="h-3.5 w-3.5" />
              Acces mobile guide
            </div>

            <div className="mt-5 grid flex-1 gap-5 min-[860px]:grid-cols-[1.15fr_0.85fr] min-[860px]:items-start">
              <div>
                <p className="text-sm font-medium text-teal-200">Version web disponible sur grand ecran</p>
                <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-white min-[600px]:text-4xl min-[800px]:text-[2.75rem]">
                  OXLIS est disponible uniquement en version web sur ordinateur.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-200 min-[600px]:text-base min-[600px]:leading-7">
                  Le site complet s'affiche a partir de 1000 px pour conserver une lecture nette des fiches, des dashboards et de la messagerie.
                  Pour tester la version mobile, telechargez notre application depuis l'App Store ou Google Play.
                </p>

                <div className="mt-6 grid gap-3 min-[640px]:grid-cols-2">
                  {storeLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="group inline-flex min-h-14 items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-3 transition duration-300 hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-400/12"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{link.label}</p>
                        <p className="mt-1 text-xs text-slate-300">{link.caption}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-teal-200 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-teal-300/20 bg-teal-400/8 px-4 py-4 text-sm leading-6 text-slate-200">
                  Si vous etes sur mobile, ouvrez OXLIS plus tard sur ordinateur pour l'interface web complete, ou utilisez directement notre application mobile pour continuer vos tests.
                </div>
              </div>

              <div className="mobile-gate-card-stack grid gap-3 min-[700px]:grid-cols-2 min-[860px]:grid-cols-1">
                {highlights.map((item) => (
                  <article key={item.title} className="last:min-[700px]:col-span-2 last:min-[860px]:col-span-1 rounded-[1.6rem] border border-white/15 bg-slate-950/35 px-4 py-4 backdrop-blur-md">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-teal-200">
                      {item.icon}
                      {item.title}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-200">{item.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}