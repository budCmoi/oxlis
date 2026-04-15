"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Building2, LogOut, Menu, X } from "lucide-react";
import { usePageTransitionRouter } from "@/components/common/page-transition-shell";
import { useAuth } from "@/components/providers/auth-provider";

const coreLinks = [
  { href: "/", label: "Annonces", helper: "Explorer les dossiers en vente" },
  { href: "/sell", label: "Vendre", helper: "Publier et piloter une annonce" },
  { href: "/dashboard", label: "Tableau de bord", helper: "Suivre vos offres et vos actifs" },
  { href: "/messages", label: "Messages", helper: "Retrouver vos conversations" },
];

export function Navbar() {
  const pathname = usePathname();
  const { push } = usePageTransitionRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const year = new Date().getFullYear();

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeSidebar = () => {
    const toggle = document.getElementById("mobile-nav-toggle") as HTMLInputElement | null;
    if (toggle) {
      toggle.checked = false;
    }
  };

  const handleLogout = () => {
    closeSidebar();
    logout();
    void push("/");
  };

  return (
    <>
      <input id="mobile-nav-toggle" type="checkbox" className="mobile-nav-toggle xl:hidden" />

      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4 lg:px-6">
        <div className="page-shell !px-0">
          <div data-page-enter className="studio-shell border-white/45 bg-[rgba(255,250,242,0.72)] px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3 xl:grid xl:grid-cols-[minmax(0,280px)_1fr_minmax(0,280px)] xl:gap-4">
              <Link href="/" className="inline-flex min-w-0 flex-1 items-center gap-3 text-slate-900 xl:flex-none">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#14110f,#2b241b)] text-white shadow-sm">
                  <Building2 className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="studio-kicker !text-[0.58rem] !tracking-[0.2em]">Digital deal flow</span>
                  <span className="mt-1 block truncate text-[1.45rem] font-bold tracking-[-0.08em] sm:text-[1.6rem]">OXLIS</span>
                </span>
              </Link>

              <nav className="hidden items-center justify-center gap-2 xl:flex">
                {coreLinks.map((link) => {
                  const isActive = isLinkActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-full px-3.5 py-2.5 text-[13px] font-semibold ${
                        isActive
                          ? "bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-[color:var(--accent-ink)] shadow-sm"
                          : "bg-white/55 text-slate-700 hover:-translate-y-0.5 hover:bg-white hover:text-slate-950"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="hidden items-center justify-end gap-2 xl:flex">
                {!isAuthenticated ? (
                  <>
                    <Link href="/auth" className="studio-button-secondary px-4 py-2.5 text-[13px]">
                      Connexion
                    </Link>
                    <Link href="/sell" className="studio-button-primary px-4 py-2.5 text-[13px]">
                      Vendre maintenant
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="rounded-full border border-white/40 bg-white/55 px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm">
                      {user?.name}
                    </div>
                    <button
                      onClick={handleLogout}
                      aria-label="Deconnexion"
                      data-testid="logout-button"
                      className="studio-button-secondary px-4 py-2.5 text-[13px]"
                    >
                      Deconnexion
                    </button>
                  </>
                )}
              </div>

              <div className="flex shrink-0 items-center justify-end gap-2 xl:hidden">
                <label
                  htmlFor="mobile-nav-toggle"
                  role="button"
                  tabIndex={0}
                  aria-label="Ouvrir le menu"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/45 bg-white/70 text-slate-700 shadow-sm"
                >
                  <Menu className="h-5 w-5" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mobile-sidebar-layer xl:hidden">
        <label htmlFor="mobile-nav-toggle" className="mobile-sidebar-backdrop" aria-label="Fermer le menu" />

        <aside className="mobile-sidebar-panel absolute inset-y-0 left-0 flex h-full w-[min(90vw,23rem)] flex-col border-r border-white/10 bg-[linear-gradient(180deg,#15120f,#221d16)] p-4 shadow-sm">
          <div className="studio-panel-dark rounded-[1.8rem] p-5">
            <p className="studio-kicker !text-[0.58rem] !tracking-[0.2em] !text-lime-200/70">Creative marketplace</p>

            <div className="mt-3 flex items-center justify-between gap-3">
              <Link href="/" className="inline-flex min-w-0 items-center gap-2 text-[1.4rem] font-semibold tracking-[-0.08em] text-white" onClick={closeSidebar}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/8">
                  <Building2 className="h-5 w-5 text-lime-300" />
                </span>
                <span className="truncate">OXLIS</span>
              </Link>

              <label
                htmlFor="mobile-nav-toggle"
                role="button"
                tabIndex={0}
                aria-label="Fermer le menu latéral"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white"
              >
                <X className="h-4 w-4" />
              </label>
            </div>

            <p className="mt-4 text-[13px] leading-6 text-white/72">
              {isAuthenticated && user?.name
                ? `Connecte en tant que ${user.name}. Reprenez vos discussions, vos deals et vos actifs depuis un seul hub.`
                : "Explorez les annonces, ouvrez une conversation et activez votre pipeline vendeur dans une interface plus editoriale."}
            </p>
          </div>

          <nav className="mt-4 flex-1 space-y-3 overflow-y-auto dashboard-scrollbar">
            {coreLinks.map((link) => {
              const isActive = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeSidebar}
                  className={`flex items-center justify-between gap-3 rounded-[1.45rem] border px-4 py-3.5 ${
                    isActive
                      ? "border-lime-300/35 bg-lime-300/12 text-white"
                      : "border-white/8 bg-white/6 text-white/80 hover:border-white/16 hover:bg-white/10"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold tracking-[-0.03em]">{link.label}</p>
                    <p className="mt-1 text-[11px] leading-5 text-white/58">{link.helper}</p>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 ${isActive ? "text-lime-300" : "text-white/35"}`} />
                </Link>
              );
            })}
          </nav>

          <div className="studio-panel mt-4 rounded-[1.6rem] px-4 py-4">
            <div className="mb-4 space-y-2 text-[10px] leading-5 text-slate-600">
              <p>© {year} OXLIS. Deals, offres, conversations et execution vendeur dans un meme cockpit.</p>
              <p>Une interface premium mobile sans sacrifier les flux existants.</p>
            </div>

            {!isAuthenticated ? (
              <div className="grid gap-2">
                <Link href="/auth" onClick={closeSidebar} className="studio-button-primary w-full text-[13px]">
                  Connexion
                </Link>
                <Link href="/sell" onClick={closeSidebar} className="studio-button-secondary w-full text-[13px]">
                  Publier un actif
                </Link>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                aria-label="Deconnexion"
                data-testid="logout-button-mobile"
                className="studio-button-secondary w-full text-[13px]"
              >
                <LogOut className="h-4 w-4" />
                Deconnexion
              </button>
            )}
          </div>
          </aside>
      </div>
    </>
  );
}
