"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShowcase } from "@/components/auth/auth-showcase";
import { useAuth } from "@/components/providers/auth-provider";
import { apiRequest } from "@/lib/api";
import { User } from "@/types";

export default function AuthPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md px-4 py-10 text-sm text-slate-500">Chargement de la connexion...</p>}>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, loginWithSession } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "BOTH",
  });

  const nextPath = searchParams.get("next") || "/dashboard";

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, isLoading, nextPath, router]);

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
      router.replace(nextPath);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Echec de l'authentification");
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:py-8">
      <div className="grid gap-6 lg:min-h-[calc(100svh-128px)] lg:grid-cols-[minmax(0,1fr)_minmax(360px,35%)] xl:gap-8">
        <AuthShowcase className="order-2 lg:order-1" />

        <section className="order-1 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7 lg:order-2 lg:flex lg:h-full lg:flex-col lg:justify-center">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Acces securise</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Entrez dans votre espace OXLIS</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Connectez-vous pour publier une annonce, suivre vos conversations ou avancer sur un deal en cours.
            </p>
          </div>

          <div className="mb-5 flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              data-testid="auth-tab-login"
              className={`w-1/2 rounded-lg px-3 py-2 text-sm font-medium ${isLogin ? "bg-white text-slate-900 shadow" : "text-slate-600"}`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              data-testid="auth-tab-register"
              className={`w-1/2 rounded-lg px-3 py-2 text-sm font-medium ${!isLogin ? "bg-white text-slate-900 shadow" : "text-slate-600"}`}
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

          {status ? <p className="mt-4 text-sm text-slate-600">{status}</p> : null}
        </section>
      </div>
    </div>
  );
}
