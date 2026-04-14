"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { usePageTransitionRouter } from "@/components/common/page-transition-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { isGoogleAuthConfigured, signInWithGooglePopup } from "@/lib/social-auth";
import { apiRequest } from "@/lib/api";
import { User } from "@/types";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.7 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.6 12 2.6A9.4 9.4 0 0 0 2.6 12 9.4 9.4 0 0 0 12 21.4c5.4 0 9-3.8 9-9.1 0-.6-.1-1.1-.1-1.5H12Z" />
      <path fill="#34A853" d="M2.6 7.9l3.2 2.3A6 6 0 0 1 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.6 12 2.6c-3.7 0-6.9 2.1-8.5 5.3Z" />
      <path fill="#FBBC05" d="M12 21.4c2.5 0 4.7-.8 6.3-2.3l-2.9-2.2c-.8.5-1.8.9-3.4.9a6 6 0 0 1-5.7-4.1l-3.2 2.4A9.4 9.4 0 0 0 12 21.4Z" />
      <path fill="#4285F4" d="M21 12.3c0-.6-.1-1.1-.2-1.6H12v3.9h5.1c-.2 1-.8 2-1.7 2.8l2.9 2.2c1.7-1.6 2.7-4 2.7-7.3Z" />
    </svg>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md px-4 py-10 text-sm text-slate-500">Chargement de la connexion...</p>}>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const { replace } = usePageTransitionRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, loginWithSession } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [activeSocialProvider, setActiveSocialProvider] = useState<"google" | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "BOTH",
  });

  const nextPath = searchParams.get("next") || "/dashboard";
  const isStatusError = status !== null && !status.startsWith("Authentification reussie");
  const googleAuthAvailable = isGoogleAuthConfigured();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void replace(nextPath);
    }
  }, [isAuthenticated, isLoading, nextPath, replace]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    try {
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, role: form.role };

      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const response = await apiRequest<{ token: string; user: User }>(endpoint, {
        method: "POST",
        body: payload,
      });

      loginWithSession(response.token, response.user);
      setStatus("Authentification reussie. Redirection vers votre espace...");
      await replace(nextPath);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Echec de l'authentification");
    }
  };

  const submitWithGoogle = async () => {
    setStatus(null);
    setActiveSocialProvider("google");

    try {
      const socialSession = await signInWithGooglePopup();
      const response = await apiRequest<{ token: string; user: User }>("/auth/google", {
        method: "POST",
        body: {
          accessToken: socialSession.accessToken,
          idToken: socialSession.idToken,
          role: isLogin ? undefined : form.role,
          name: !isLogin && form.name.trim() ? form.name.trim() : socialSession.name ?? undefined,
        },
      });

      loginWithSession(response.token, response.user);
      setStatus("Authentification reussie. Redirection vers votre espace...");
      await replace(nextPath);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Connexion Google impossible");
    } finally {
      setActiveSocialProvider(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:py-8">
      <div className="grid gap-6 lg:min-h-[calc(100svh-128px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,35%)] xl:gap-8">
        <AuthShowcase className="order-2 lg:order-1" />

        <section className="order-1 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7 lg:order-2 lg:flex lg:h-full lg:flex-col lg:justify-center">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Acces securise</p>
            <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl">Entrez dans votre espace OXLIS</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Connectez-vous pour publier une annonce, suivre vos conversations ou avancer sur un deal en cours.
            </p>
          </div>

          <div className="mb-5 flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              data-testid="auth-tab-login"
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium sm:text-sm ${isLogin ? "bg-white text-slate-900 shadow" : "text-slate-600"}`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              data-testid="auth-tab-register"
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium sm:text-sm ${!isLogin ? "bg-white text-slate-900 shadow" : "text-slate-600"}`}
            >
              Creer un compte
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {!isLogin ? (
              <input
                autoComplete="name"
                aria-label="Nom complet"
                placeholder="Nom complet"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
              />
            ) : null}
            <input
              type="email"
              autoComplete={isLogin ? "username" : "email"}
              aria-label="E-mail"
              placeholder="E-mail"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
            />
            <input
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              aria-label="Mot de passe"
              placeholder="Mot de passe"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
            />
            {!isLogin ? (
              <select
                aria-label="Role"
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
              >
                <option value="BUYER">Acheteur</option>
                <option value="SELLER">Vendeur</option>
                <option value="BOTH">Acheteur & vendeur</option>
              </select>
            ) : null}

            <button data-testid="auth-submit" className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-600">
              {isLogin ? "Connexion" : "Creer un compte"}
            </button>
          </form>

          {googleAuthAvailable ? (
            <>
              <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                <span>ou</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid gap-2">
                <button
                  type="button"
                  aria-label="Continuer avec Google"
                  title="Google"
                  onClick={submitWithGoogle}
                  disabled={activeSocialProvider !== null}
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {activeSocialProvider === "google" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <GoogleLogo />}
                </button>
              </div>
            </>
          ) : null}

          {status ? (
            <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${isStatusError ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
              {status}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
