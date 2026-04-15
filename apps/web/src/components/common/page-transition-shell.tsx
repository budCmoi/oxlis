"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type TransitionRouter = {
  push: (href: string) => Promise<void>;
  replace: (href: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const PageTransitionContext = createContext<TransitionRouter | null>(null);

function createTransitionRouter(router: {
  push: (href: string) => void;
  replace: (href: string) => void;
  refresh: () => void;
}): TransitionRouter {
  return {
    push: async (href: string) => {
      router.push(href);
    },
    replace: async (href: string) => {
      router.replace(href);
    },
    refresh: async () => {
      router.refresh();
    },
  };
}

export function usePageTransitionRouter() {
  const router = useRouter();
  return useContext(PageTransitionContext) ?? createTransitionRouter(router);
}

export function PageTransitionShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const transitionRouter = useMemo(() => createTransitionRouter(router), [router]);

  return (
    <PageTransitionContext.Provider value={transitionRouter}>{children}</PageTransitionContext.Provider>
  );
}