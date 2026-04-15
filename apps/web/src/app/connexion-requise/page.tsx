"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { ArrowRight, LockKeyhole, MessageSquare, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { usePageTransitionRouter } from "@/components/common/page-transition-shell";
import { useAuth } from "@/components/providers/auth-provider";

export default function ConnexionRequisePage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md px-4 py-10 text-sm text-slate-500">Chargement de l&apos;acces securise...</p>}>
      <ConnexionRequiseContent />
    </Suspense>
  );
}

function ConnexionRequiseContent() {
  const { replace } = usePageTransitionRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const nextPath = searchParams.get("next") || "/dashboard";
  const authHref = `/auth?next=${encodeURIComponent(nextPath)}`;

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void replace(nextPath);
    }
  }, [isAuthenticated, isLoading, nextPath, replace]);

  return (
    <div className="page-shell page-stack pt-4 sm:pt-6">
      <div className="grid gap-6 lg:h-[calc(100svh-136px)] lg:max-h-[calc(100svh-136px)] lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.85fr)] lg:overflow-hidden xl:gap-8">
        <AuthShowcase className="order-2 lg:order-1 lg:max-h-full" viewportBounded />

        <section className="studio-shell order-1 px-6 py-6 sm:px-7 sm:py-7 lg:order-2 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:justify-start lg:overflow-y-auto">
          <div className="mb-4">
            <p className="studio-kicker">Acces protege</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">Authentification requise</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Connectez-vous pour acceder a vos annonces, offres et conversations, puis reprendre exactement la ou vous en etiez.
            </p>
          </div>

          <div className="studio-panel px-4 py-4">
            <p className="studio-kicker !text-[0.62rem] !tracking-[0.18em]">Destination demandee</p>
            <p className="mt-2 break-all text-sm font-medium text-slate-950">{nextPath}</p>
          </div>

          <div className="mt-4 grid gap-2">
            <div className="studio-card p-3">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--warm)]" />
                <div>
                  <p className="text-sm font-semibold text-slate-950">Espaces prives</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Brouillons, annonces et transactions reserves.</p>
                </div>
              </div>
            </div>
            <div className="studio-card p-3">
              <div className="flex items-start gap-3">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--warm)]" />
                <div>
                  <p className="text-sm font-semibold text-slate-950">Conversations protegees</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Messagerie et negociations liees a votre session.</p>
                </div>
              </div>
            </div>
            <div className="studio-card p-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--warm)]" />
                <div>
                  <p className="text-sm font-semibold text-slate-950">Acces securise</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Retour direct vers la section demandee apres connexion.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href={authHref} className="studio-button-primary text-sm">
              Aller a la connexion
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/" className="studio-button-secondary text-sm">
              Retour a l&apos;accueil
            </Link>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            Pas encore de compte ? Vous pouvez aussi en creer un depuis la connexion.
          </p>
        </section>
      </div>
    </div>
  );
}