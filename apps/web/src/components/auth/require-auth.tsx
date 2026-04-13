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
    return <p className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500">Verification de votre session...</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
