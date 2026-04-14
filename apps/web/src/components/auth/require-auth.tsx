"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const redirectPath = `/connexion-requise?next=${encodeURIComponent(pathname)}`;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(redirectPath);
    }
  }, [isAuthenticated, isLoading, redirectPath, router]);

  if (isLoading) {
    return (
      <div className="w-full px-4 py-5 sm:px-5 sm:py-7 lg:px-6">
        <div className="mx-auto max-w-2xl rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6 sm:py-6">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-500" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Acces securise</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Verification de votre session en cours...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full px-4 py-5 sm:px-5 sm:py-7 lg:px-6">
        <div className="mx-auto max-w-2xl rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-6 sm:py-6">
          <div className="flex items-start gap-3">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Redirection</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Nous vous redirigeons vers l&apos;espace de connexion securise.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
