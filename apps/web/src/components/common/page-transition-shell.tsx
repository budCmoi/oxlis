"use client";

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { gsap } from "gsap";

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const transitionRouter = useMemo(() => createTransitionRouter(router), [router]);
  const searchKey = searchParams.toString();

  useEffect(() => {
    const stage = stageRef.current;

    if (!stage || typeof window === "undefined") {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

    const ctx = gsap.context(() => {
      if (reducedMotion) {
        return;
      }

      const targets = stage.querySelectorAll<HTMLElement>("[data-page-enter]");
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });

      timeline.fromTo(
        stage,
        { opacity: 0, filter: "blur(8px)" },
        {
          opacity: 1,
          filter: "blur(0px)",
          duration: coarsePointer ? 0.35 : 0.48,
          clearProps: "opacity,filter",
        },
      );

      if (targets.length > 0) {
        timeline.fromTo(
          targets,
          { opacity: 0, y: coarsePointer ? 18 : 34 },
          {
            opacity: 1,
            y: 0,
            duration: coarsePointer ? 0.52 : 0.88,
            stagger: coarsePointer ? 0.04 : 0.08,
            clearProps: "transform,opacity",
          },
          0.08,
        );
      } else {
        timeline.fromTo(
          stage,
          { y: coarsePointer ? 14 : 24 },
          { y: 0, duration: coarsePointer ? 0.42 : 0.68, clearProps: "transform" },
          0,
        );
      }
    }, stage);

    return () => ctx.revert();
  }, [pathname, searchKey]);

  return (
    <PageTransitionContext.Provider value={transitionRouter}>
      <div ref={stageRef} className="page-transition-shell min-h-full">
        {children}
      </div>
    </PageTransitionContext.Provider>
  );
}