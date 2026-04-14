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
      <input id="mobile-nav-toggle" type="checkbox" className="mobile-nav-toggle md:hidden" />

      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[color:var(--surface)]/95 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
            <Building2 className="h-5 w-5 text-teal-600" />
            OXLIS
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {coreLinks.map((link) => {
              const isActive = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-teal-600 text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {!isAuthenticated ? (
              <Link
                href="/auth"
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isLinkActive("/auth")
                    ? "bg-teal-600 text-white"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                Connexion
              </Link>
            ) : (
              <>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {user?.name}
                </span>
                <button
                  onClick={handleLogout}
                  aria-label="Deconnexion"
                  data-testid="logout-button"
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Deconnexion
                </button>
              </>
            )}
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <label
              htmlFor="mobile-nav-toggle"
              role="button"
              tabIndex={0}
              aria-label="Ouvrir le menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Menu className="h-5 w-5" />
            </label>
          </div>
        </div>
      </div>
      </header>

      <div className="mobile-sidebar-layer md:hidden">
          <label htmlFor="mobile-nav-toggle" className="mobile-sidebar-backdrop" aria-label="Fermer le menu" />

          <aside className="mobile-sidebar-panel absolute inset-y-0 left-0 flex w-[min(88vw,22rem)] flex-col border-r border-slate-200 bg-white shadow-[0_28px_80px_-28px_rgba(15,23,42,0.4)]">
            <div className="border-b border-slate-200 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
                  <Building2 className="h-5 w-5 text-teal-600" />
                  OXLIS
                </Link>

                <label
                  htmlFor="mobile-nav-toggle"
                  role="button"
                  tabIndex={0}
                  aria-label="Fermer le menu latéral"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
                >
                  <X className="h-4 w-4" />
                </label>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Navigation mobile</p>
                <p className="mt-1 text-sm text-slate-700">
                  {isAuthenticated && user?.name ? `Connecte en tant que ${user.name}` : "Accedez rapidement aux sections principales sans bandeau coupe."}
                </p>
              </div>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4 dashboard-scrollbar">
              {coreLinks.map((link) => {
                const isActive = isLinkActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 transition ${
                      isActive
                        ? "border-teal-300 bg-teal-50 text-slate-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                      onClick={closeSidebar}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{link.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{link.helper}</p>
                    </div>
                    <ArrowRight className={`h-4 w-4 shrink-0 ${isActive ? "text-teal-700" : "text-slate-400"}`} />
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 px-4 py-4">
              <div className="mb-4 space-y-2 text-[11px] leading-5 text-slate-500">
                <p>© {year} OXLIS. Marketplace pour la transmission de business numeriques.</p>
                <p>Annonces, conversations, offres et sequestre simule dans un meme environnement.</p>
              </div>

              {!isAuthenticated ? (
                <Link
                  href="/auth"
                  onClick={closeSidebar}
                  className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-600"
                >
                  Connexion
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  aria-label="Deconnexion"
                  data-testid="logout-button-mobile"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
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
