"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { ArrowRight, LockKeyhole, MessageSquare, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { useAuth } from "@/components/providers/auth-provider";

export default function ConnexionRequisePage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md px-4 py-10 text-sm text-slate-500">Chargement de l'acces securise...</p>}>
      <ConnexionRequiseContent />
    </Suspense>
  );
}

function ConnexionRequiseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const nextPath = searchParams.get("next") || "/dashboard";
  const authHref = `/auth?next=${encodeURIComponent(nextPath)}`;

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, isLoading, nextPath, router]);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:py-8">
      <div className="grid gap-6 lg:h-[calc(100svh-128px)] lg:max-h-[calc(100svh-128px)] lg:grid-cols-[minmax(0,1fr)_minmax(360px,35%)] lg:overflow-hidden xl:gap-8">
        <AuthShowcase className="order-2 lg:order-1 lg:max-h-full" viewportBounded />

        <section className="order-1 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7 lg:order-2 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:justify-start lg:overflow-y-auto">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Acces protege</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Authentification requise</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Connectez-vous pour acceder a vos annonces, offres et conversations, puis reprendre exactement la ou vous en etiez.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Destination demandee</p>
            <p className="mt-1 break-all text-sm font-medium text-slate-900">{nextPath}</p>
          </div>

          <div className="mt-4 grid gap-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Espaces prives</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Brouillons, annonces et transactions reserves.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-start gap-3">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Conversations protegees</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Messagerie et negociations liees a votre session.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Acces securise</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">Retour direct vers la section demandee apres connexion.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={authHref}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-600"
            >
              Aller a la connexion
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
            >
              Retour a l'accueil
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