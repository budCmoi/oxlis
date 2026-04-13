"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LogOut, MessageCircle, PlusCircle } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

const coreLinks = [
  { href: "/", label: "Annonces" },
  { href: "/sell", label: "Vendre" },
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/messages", label: "Messages" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[color:var(--surface)]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
          <Building2 className="h-5 w-5 text-teal-600" />
          OXLIS
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {coreLinks.map((link) => {
            const isActive = pathname === link.href;
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
                pathname === "/auth"
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
          <Link href="/sell" className="rounded-full border border-slate-300 p-2 text-slate-700">
            <PlusCircle className="h-4 w-4" />
          </Link>
          <Link href="/messages" className="rounded-full border border-slate-300 p-2 text-slate-700">
            <MessageCircle className="h-4 w-4" />
          </Link>
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="rounded-full border border-slate-300 p-2 text-slate-700"
              aria-label="Deconnexion"
              data-testid="logout-button-mobile"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <Link href="/auth" className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
