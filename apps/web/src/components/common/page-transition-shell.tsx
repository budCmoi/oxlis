"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { gsap } from "gsap";

type TransitionMode = "push" | "replace";
type TransitionPhase = "idle" | "entering" | "exiting";
type TransitionVariant = "horizontal" | "vertical" | "focus";
type RouteFamily = "home" | "listing" | "dashboard" | "editor" | "messages" | "auth" | "protected" | "sell" | "other";

type MotionProfile = {
  x?: number;
  y?: number;
  scale?: number;
  rotateX?: number;
  rotateY?: number;
  filter?: string;
  duration: number;
  ease: string;
  transformOrigin?: string;
};

type TransitionProfile = {
  label: string;
  variant: TransitionVariant;
  scrim: string;
  base: string;
  tint: string;
  accent: string;
  origin: string;
  alternateOrigin: string;
  enter: MotionProfile;
  exit: MotionProfile;
};

type PendingNavigation = {
  href: string;
  mode: TransitionMode;
};

type RouteDescriptor = {
  pathname: string;
  search: string;
  routeKey: string;
};

type TransitionRouter = {
  push: (href: string) => Promise<void>;
  replace: (href: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const PageTransitionContext = createContext<TransitionRouter | null>(null);

function normalizeHref(href: string) {
  const url = new URL(href, window.location.origin);
  return `${url.pathname}${url.search}${url.hash}`;
}

function buildRouteKey(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname;
}

function getRouteDescriptorFromHref(href: string): RouteDescriptor {
  const url = new URL(href, window.location.origin);
  const search = url.search.replace(/^\?/, "");

  return {
    pathname: url.pathname,
    search,
    routeKey: buildRouteKey(url.pathname, search),
  };
}

function getRouteFamily(pathname: string): RouteFamily {
  if (pathname === "/") {
    return "home";
  }

  if (pathname.startsWith("/dashboard/listings/")) {
    return "editor";
  }

  if (pathname.startsWith("/listings/")) {
    return "listing";
  }

  if (pathname.startsWith("/dashboard")) {
    return "dashboard";
  }

  if (pathname.startsWith("/messages")) {
    return "messages";
  }

  if (pathname.startsWith("/auth")) {
    return "auth";
  }

  if (pathname.startsWith("/connexion-requise")) {
    return "protected";
  }

  if (pathname.startsWith("/sell")) {
    return "sell";
  }

  return "other";
}

function getProtectedLabel(search: string) {
  const params = new URLSearchParams(search);
  const nextPath = params.get("next") || "";

  if (nextPath.startsWith("/sell")) {
    return "Acces vente";
  }

  if (nextPath.startsWith("/dashboard")) {
    return "Acces dashboard";
  }

  if (nextPath.startsWith("/messages")) {
    return "Acces messages";
  }

  return "Acces securise";
}

function getRouteLabel(pathname: string, search: string) {
  switch (getRouteFamily(pathname)) {
    case "home":
      return "Marketplace";
    case "auth":
      return "Connexion";
    case "protected":
      return getProtectedLabel(search);
    case "sell":
      return "Vendre";
    case "dashboard":
      return "Dashboard";
    case "messages":
      return "Messages";
    case "listing":
      return "Annonce";
    case "editor":
      return "Edition";
    default:
      return "OXLIS";
  }
}

function getTransitionProfile(pathname: string, search: string): TransitionProfile {
  const family = getRouteFamily(pathname);
  const label = getRouteLabel(pathname, search);

  switch (family) {
    case "home":
      return {
        label,
        variant: "horizontal",
        scrim: "radial-gradient(circle at 50% 10%, rgba(45,212,191,0.26), rgba(15,23,42,0.86) 58%, rgba(2,6,23,0.98))",
        base: "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(15,118,110,0.96))",
        tint: "linear-gradient(180deg, rgba(153,246,228,0.96), rgba(248,250,252,0.94))",
        accent: "#99f6e4",
        origin: "50% 0%",
        alternateOrigin: "50% 100%",
        enter: { y: 120, scale: 0.94, filter: "blur(26px)", duration: 1.08, ease: "expo.out", transformOrigin: "50% 0%" },
        exit: { y: -44, scale: 1.04, filter: "blur(18px)", duration: 0.66, ease: "power3.inOut", transformOrigin: "50% 0%" },
      };
    case "auth":
      return {
        label,
        variant: "focus",
        scrim: "radial-gradient(circle at 50% 50%, rgba(148,163,184,0.16), rgba(15,23,42,0.94) 64%, rgba(2,6,23,0.99))",
        base: "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.14), rgba(15,23,42,0.98) 68%)",
        tint: "radial-gradient(circle at 50% 45%, rgba(45,212,191,0.18), rgba(15,23,42,0.84) 72%)",
        accent: "#e2e8f0",
        origin: "50% 50%",
        alternateOrigin: "50% 50%",
        enter: { y: 34, scale: 0.88, filter: "blur(24px)", duration: 0.96, ease: "expo.out", transformOrigin: "50% 50%" },
        exit: { y: -18, scale: 1.06, filter: "blur(18px)", duration: 0.58, ease: "power3.inOut", transformOrigin: "50% 50%" },
      };
    case "protected":
      return {
        label,
        variant: "focus",
        scrim: "radial-gradient(circle at 50% 30%, rgba(45,212,191,0.18), rgba(15,23,42,0.94) 64%, rgba(2,6,23,0.99))",
        base: "radial-gradient(circle at 50% 40%, rgba(45,212,191,0.2), rgba(15,23,42,0.98) 68%)",
        tint: "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.1), rgba(15,118,110,0.62) 72%, rgba(15,23,42,0.94))",
        accent: "#5eead4",
        origin: "50% 50%",
        alternateOrigin: "50% 50%",
        enter: { y: 28, scale: 0.9, filter: "blur(22px)", duration: 0.98, ease: "expo.out", transformOrigin: "50% 50%" },
        exit: { y: -16, scale: 1.05, filter: "blur(18px)", duration: 0.56, ease: "power3.inOut", transformOrigin: "50% 50%" },
      };
    case "sell":
      return {
        label,
        variant: "vertical",
        scrim: "radial-gradient(circle at 85% 50%, rgba(45,212,191,0.18), rgba(15,23,42,0.9) 58%, rgba(2,6,23,0.98))",
        base: "linear-gradient(90deg, rgba(2,6,23,0.98), rgba(15,23,42,0.96))",
        tint: "linear-gradient(90deg, rgba(45,212,191,0.92), rgba(248,250,252,0.9))",
        accent: "#5eead4",
        origin: "100% 50%",
        alternateOrigin: "0% 50%",
        enter: { x: 120, scale: 0.95, filter: "blur(24px)", duration: 1.02, ease: "expo.out", transformOrigin: "100% 50%" },
        exit: { x: -42, scale: 1.03, filter: "blur(18px)", duration: 0.62, ease: "power3.inOut", transformOrigin: "100% 50%" },
      };
    case "dashboard":
      return {
        label,
        variant: "horizontal",
        scrim: "radial-gradient(circle at 50% 85%, rgba(226,232,240,0.18), rgba(15,23,42,0.92) 56%, rgba(2,6,23,0.98))",
        base: "linear-gradient(180deg, rgba(2,6,23,0.98), rgba(30,41,59,0.96))",
        tint: "linear-gradient(180deg, rgba(226,232,240,0.92), rgba(148,163,184,0.78))",
        accent: "#f8fafc",
        origin: "50% 100%",
        alternateOrigin: "50% 0%",
        enter: { y: 110, scale: 0.94, rotateX: 4, filter: "blur(24px)", duration: 1.06, ease: "expo.out", transformOrigin: "50% 100%" },
        exit: { y: -34, scale: 1.04, rotateX: -2, filter: "blur(18px)", duration: 0.64, ease: "power3.inOut", transformOrigin: "50% 100%" },
      };
    case "messages":
      return {
        label,
        variant: "vertical",
        scrim: "radial-gradient(circle at 8% 50%, rgba(45,212,191,0.2), rgba(15,23,42,0.9) 58%, rgba(2,6,23,0.98))",
        base: "linear-gradient(90deg, rgba(15,118,110,0.98), rgba(15,23,42,0.98))",
        tint: "linear-gradient(90deg, rgba(240,253,250,0.92), rgba(153,246,228,0.82))",
        accent: "#a7f3d0",
        origin: "0% 50%",
        alternateOrigin: "100% 50%",
        enter: { x: -120, scale: 0.96, filter: "blur(22px)", duration: 1.02, ease: "expo.out", transformOrigin: "0% 50%" },
        exit: { x: 44, scale: 1.02, filter: "blur(18px)", duration: 0.62, ease: "power3.inOut", transformOrigin: "0% 50%" },
      };
    case "listing":
      return {
        label,
        variant: "vertical",
        scrim: "radial-gradient(circle at 92% 40%, rgba(203,213,225,0.18), rgba(15,23,42,0.92) 60%, rgba(2,6,23,0.98))",
        base: "linear-gradient(90deg, rgba(15,23,42,0.98), rgba(51,65,85,0.96))",
        tint: "linear-gradient(90deg, rgba(226,232,240,0.94), rgba(248,250,252,0.88))",
        accent: "#e2e8f0",
        origin: "100% 50%",
        alternateOrigin: "0% 50%",
        enter: { x: 110, scale: 0.95, filter: "blur(24px)", duration: 1.04, ease: "expo.out", transformOrigin: "100% 50%" },
        exit: { x: -40, scale: 1.03, filter: "blur(18px)", duration: 0.62, ease: "power3.inOut", transformOrigin: "100% 50%" },
      };
    case "editor":
      return {
        label,
        variant: "horizontal",
        scrim: "radial-gradient(circle at 50% 85%, rgba(45,212,191,0.18), rgba(15,23,42,0.92) 58%, rgba(2,6,23,0.98))",
        base: "linear-gradient(180deg, rgba(15,118,110,0.96), rgba(2,6,23,0.98))",
        tint: "linear-gradient(180deg, rgba(240,253,250,0.88), rgba(153,246,228,0.76))",
        accent: "#ccfbf1",
        origin: "50% 100%",
        alternateOrigin: "50% 0%",
        enter: { y: 110, scale: 0.93, rotateX: 4, filter: "blur(24px)", duration: 1.04, ease: "expo.out", transformOrigin: "50% 100%" },
        exit: { y: -30, scale: 1.04, rotateX: -2, filter: "blur(18px)", duration: 0.62, ease: "power3.inOut", transformOrigin: "50% 100%" },
      };
    default:
      return {
        label,
        variant: "horizontal",
        scrim: "radial-gradient(circle at 50% 20%, rgba(226,232,240,0.14), rgba(15,23,42,0.92) 58%, rgba(2,6,23,0.98))",
        base: "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(51,65,85,0.96))",
        tint: "linear-gradient(180deg, rgba(226,232,240,0.88), rgba(248,250,252,0.92))",
        accent: "#e2e8f0",
        origin: "50% 0%",
        alternateOrigin: "50% 100%",
        enter: { y: 90, scale: 0.95, filter: "blur(22px)", duration: 0.96, ease: "expo.out", transformOrigin: "50% 0%" },
        exit: { y: -28, scale: 1.03, filter: "blur(18px)", duration: 0.58, ease: "power3.inOut", transformOrigin: "50% 0%" },
      };
  }
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function runTimeline(timeline: gsap.core.Timeline) {
  return new Promise<void>((resolve) => {
    const finish = () => resolve();

    timeline.eventCallback("onComplete", finish);
    timeline.eventCallback("onInterrupt", finish);
  });
}

export function usePageTransitionRouter() {
  const router = useRouter();
  const context = useContext(PageTransitionContext);

  if (context) {
    return context;
  }

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
  } satisfies TransitionRouter;
}

export function PageTransitionShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const routeKey = buildRouteKey(pathname, search);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelPrimaryRef = useRef<HTMLDivElement | null>(null);
  const panelSecondaryRef = useRef<HTMLDivElement | null>(null);
  const accentRef = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLParagraphElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const hasMountedRef = useRef(false);
  const activePathRef = useRef(pathname);
  const activeSearchRef = useRef(search);
  const activeRouteRef = useRef(routeKey);
  const phaseRef = useRef<TransitionPhase>("idle");
  const queuedNavigationRef = useRef<PendingNavigation | null>(null);

  const setTransitioningState = useCallback((active: boolean) => {
    const shell = shellRef.current;

    if (!shell) {
      return;
    }

    shell.dataset.transitioning = active ? "true" : "false";
  }, []);

  const applyOverlayTheme = useCallback((profile: TransitionProfile) => {
    const overlay = overlayRef.current;
    const panelPrimary = panelPrimaryRef.current;
    const panelSecondary = panelSecondaryRef.current;
    const accent = accentRef.current;
    const label = labelRef.current;

    if (!overlay || !panelPrimary || !panelSecondary || !accent || !label) {
      return null;
    }

    overlay.style.setProperty("--page-transition-scrim", profile.scrim);
    panelPrimary.style.setProperty("--page-transition-panel-fill", profile.base);
    panelSecondary.style.setProperty("--page-transition-panel-fill", profile.tint);
    accent.style.setProperty("--page-transition-accent-fill", profile.accent);
    label.textContent = profile.label;

    return {
      overlay,
      panelPrimary,
      panelSecondary,
      accent,
      label,
    };
  }, []);

  const cancelAnimations = useCallback(() => {
    timelineRef.current?.kill();
    timelineRef.current = null;

    const targets = [
      stageRef.current,
      overlayRef.current,
      panelPrimaryRef.current,
      panelSecondaryRef.current,
      accentRef.current,
      labelRef.current,
    ].filter(Boolean);

    if (targets.length > 0) {
      gsap.killTweensOf(targets);
    }
  }, []);

  const setOverlayClosed = useCallback(
    (profile: TransitionProfile) => {
      const refs = applyOverlayTheme(profile);

      if (!refs) {
        return null;
      }

      const { overlay, panelPrimary, panelSecondary, accent, label } = refs;

      gsap.set(overlay, {
        autoAlpha: 1,
        filter: "blur(0px)",
      });

      if (profile.variant === "horizontal") {
        gsap.set(panelPrimary, { autoAlpha: 1, scaleX: 1, scaleY: 0, transformOrigin: profile.origin });
        gsap.set(panelSecondary, { autoAlpha: 0.94, scaleX: 1, scaleY: 0, transformOrigin: profile.alternateOrigin });
        gsap.set(accent, { autoAlpha: 0.9, rotate: 0, scaleX: 0, scaleY: 1, transformOrigin: "0% 50%" });
        gsap.set(label, { autoAlpha: 0, x: 0, y: 28 });
        return refs;
      }

      if (profile.variant === "vertical") {
        gsap.set(panelPrimary, { autoAlpha: 1, scaleX: 0, scaleY: 1, transformOrigin: profile.origin });
        gsap.set(panelSecondary, { autoAlpha: 0.94, scaleX: 0, scaleY: 1, transformOrigin: profile.alternateOrigin });
        gsap.set(accent, { autoAlpha: 0.9, rotate: 90, scaleX: 0, scaleY: 1, transformOrigin: "0% 50%" });
        gsap.set(label, { autoAlpha: 0, x: 30, y: 0 });
        return refs;
      }

      gsap.set(panelPrimary, { autoAlpha: 0, scale: 0.82, transformOrigin: profile.origin, borderRadius: "3rem" });
      gsap.set(panelSecondary, { autoAlpha: 0, scale: 0.58, transformOrigin: profile.alternateOrigin, borderRadius: "999px" });
      gsap.set(accent, { autoAlpha: 0.9, rotate: 0, scaleX: 0, scaleY: 1, transformOrigin: "50% 50%" });
      gsap.set(label, { autoAlpha: 0, x: 0, y: 20 });

      return refs;
    },
    [applyOverlayTheme],
  );

  const setOverlayCovered = useCallback(
    (profile: TransitionProfile) => {
      const refs = applyOverlayTheme(profile);

      if (!refs) {
        return null;
      }

      const { overlay, panelPrimary, panelSecondary, accent, label } = refs;

      gsap.set(overlay, {
        autoAlpha: 1,
        filter: "blur(0px)",
      });

      if (profile.variant === "horizontal") {
        gsap.set(panelPrimary, { autoAlpha: 1, scaleX: 1, scaleY: 1, transformOrigin: profile.origin });
        gsap.set(panelSecondary, { autoAlpha: 0.94, scaleX: 1, scaleY: 1, transformOrigin: profile.alternateOrigin });
        gsap.set(accent, { autoAlpha: 0.92, rotate: 0, scaleX: 1, scaleY: 1, transformOrigin: "0% 50%" });
        gsap.set(label, { autoAlpha: 1, x: 0, y: 0 });
        return refs;
      }

      if (profile.variant === "vertical") {
        gsap.set(panelPrimary, { autoAlpha: 1, scaleX: 1, scaleY: 1, transformOrigin: profile.origin });
        gsap.set(panelSecondary, { autoAlpha: 0.94, scaleX: 1, scaleY: 1, transformOrigin: profile.alternateOrigin });
        gsap.set(accent, { autoAlpha: 0.92, rotate: 90, scaleX: 1, scaleY: 1, transformOrigin: "0% 50%" });
        gsap.set(label, { autoAlpha: 1, x: 0, y: 0 });
        return refs;
      }

      gsap.set(panelPrimary, { autoAlpha: 1, scale: 1.02, transformOrigin: profile.origin, borderRadius: "3rem" });
      gsap.set(panelSecondary, { autoAlpha: 0.92, scale: 1.14, transformOrigin: profile.alternateOrigin, borderRadius: "999px" });
      gsap.set(accent, { autoAlpha: 0.92, rotate: 0, scaleX: 1, scaleY: 1, transformOrigin: "50% 50%" });
      gsap.set(label, { autoAlpha: 1, x: 0, y: 0 });

      return refs;
    },
    [applyOverlayTheme],
  );

  const animateOut = useCallback(
    async (currentPath: string, currentSearch: string, nextPath: string, nextSearch: string) => {
      const stage = stageRef.current;

      if (!stage) {
        return;
      }

      const currentProfile = getTransitionProfile(currentPath, currentSearch);
      const nextProfile = getTransitionProfile(nextPath, nextSearch);
      const refs = setOverlayClosed(nextProfile);

      if (!refs) {
        return;
      }

      const { overlay, panelPrimary, panelSecondary, accent, label } = refs;

      cancelAnimations();

      gsap.set(stage, {
        autoAlpha: 1,
        willChange: "transform, opacity, filter",
      });

      const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });
      timelineRef.current = timeline;

      timeline.to(
        overlay,
        {
          autoAlpha: 1,
          duration: 0.01,
          ease: "none",
        },
        0,
      );

      if (nextProfile.variant === "focus") {
        timeline.to(panelPrimary, { autoAlpha: 1, scale: 1.02, duration: 0.52, ease: "expo.inOut" }, 0);
        timeline.to(panelSecondary, { autoAlpha: 0.92, scale: 1.14, duration: 0.62, ease: "expo.inOut" }, 0.06);
      } else if (nextProfile.variant === "vertical") {
        timeline.to(panelPrimary, { scaleX: 1, duration: 0.48, ease: "expo.inOut" }, 0);
        timeline.to(panelSecondary, { scaleX: 1, duration: 0.58, ease: "expo.inOut" }, 0.08);
      } else {
        timeline.to(panelPrimary, { scaleY: 1, duration: 0.48, ease: "expo.inOut" }, 0);
        timeline.to(panelSecondary, { scaleY: 1, duration: 0.58, ease: "expo.inOut" }, 0.08);
      }

      timeline.to(accent, { scaleX: 1, autoAlpha: 1, duration: 0.34, ease: "power2.out" }, 0.18);
      timeline.to(label, { autoAlpha: 1, x: 0, y: 0, duration: 0.36, ease: "power3.out" }, 0.2);
      timeline.to(
        stage,
        {
          autoAlpha: 0,
          x: currentProfile.exit.x ?? 0,
          y: currentProfile.exit.y ?? 0,
          scale: currentProfile.exit.scale ?? 1,
          rotateX: currentProfile.exit.rotateX ?? 0,
          rotateY: currentProfile.exit.rotateY ?? 0,
          filter: currentProfile.exit.filter ?? "blur(18px)",
          transformOrigin: currentProfile.exit.transformOrigin ?? "50% 50%",
          duration: Math.max(currentProfile.exit.duration, 0.58),
          ease: currentProfile.exit.ease,
        },
        0.02,
      );

      await runTimeline(timeline);

      if (timelineRef.current === timeline) {
        timelineRef.current = null;
      }
    },
    [cancelAnimations, setOverlayClosed],
  );

  const executeNavigation = useCallback(
    async (href: string, mode: TransitionMode) => {
      const normalizedHref = normalizeHref(href);
      const nextRoute = getRouteDescriptorFromHref(normalizedHref);
      const currentRouteKey = activeRouteRef.current;
      const currentPathname = activePathRef.current;
      const currentSearch = activeSearchRef.current;

      if (nextRoute.routeKey === currentRouteKey || prefersReducedMotion()) {
        if (mode === "replace") {
          router.replace(normalizedHref);
          return;
        }

        router.push(normalizedHref);
        return;
      }

      if (phaseRef.current === "exiting") {
        queuedNavigationRef.current = { href: normalizedHref, mode };
        return;
      }

      if (phaseRef.current === "entering") {
        cancelAnimations();
        phaseRef.current = "idle";
      }

      phaseRef.current = "exiting";
      setTransitioningState(true);

      await animateOut(currentPathname, currentSearch, nextRoute.pathname, nextRoute.search);

      if (mode === "replace") {
        router.replace(normalizedHref);
        return;
      }

      router.push(normalizedHref);
    },
    [animateOut, cancelAnimations, router, setTransitioningState],
  );

  const animateIn = useCallback(
    async (nextPath: string, nextSearch: string, initial = false) => {
      const stage = stageRef.current;
      const overlay = overlayRef.current;

      if (!stage || !overlay) {
        phaseRef.current = "idle";
        setTransitioningState(false);
        return;
      }

      const profile = getTransitionProfile(nextPath, nextSearch);
      const refs = setOverlayCovered(profile);
      const durationScale = initial ? 0.86 : 1;

      if (!refs) {
        phaseRef.current = "idle";
        setTransitioningState(false);
        return;
      }

      const { panelPrimary, panelSecondary, accent, label } = refs;

      cancelAnimations();

      gsap.set(stage, {
        autoAlpha: 0,
        x: profile.enter.x ?? 0,
        y: profile.enter.y ?? 0,
        scale: profile.enter.scale ?? 1,
        rotateX: profile.enter.rotateX ?? 0,
        rotateY: profile.enter.rotateY ?? 0,
        filter: profile.enter.filter ?? "blur(24px)",
        transformOrigin: profile.enter.transformOrigin ?? "50% 50%",
        willChange: "transform, opacity, filter",
      });

      const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });
      timelineRef.current = timeline;

      timeline.to(label, { autoAlpha: 0, x: 0, y: -16, duration: 0.22, ease: "power2.out" }, 0.02);
      timeline.to(accent, { scaleX: 0, autoAlpha: 0.9, duration: 0.28, ease: "power2.in" }, 0.08);

      if (profile.variant === "focus") {
        timeline.to(panelSecondary, { autoAlpha: 0, scale: 1.22, duration: 0.56, ease: "expo.inOut" }, 0.12);
        timeline.to(panelPrimary, { autoAlpha: 0, scale: 1.16, duration: 0.64, ease: "expo.inOut" }, 0.18);
      } else if (profile.variant === "vertical") {
        timeline.to(panelSecondary, { scaleX: 0, duration: 0.52, ease: "expo.inOut" }, 0.12);
        timeline.to(panelPrimary, { scaleX: 0, duration: 0.62, ease: "expo.inOut" }, 0.2);
      } else {
        timeline.to(panelSecondary, { scaleY: 0, duration: 0.52, ease: "expo.inOut" }, 0.12);
        timeline.to(panelPrimary, { scaleY: 0, duration: 0.62, ease: "expo.inOut" }, 0.2);
      }

      timeline.to(
        stage,
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          scale: 1,
          rotateX: 0,
          rotateY: 0,
          filter: "blur(0px)",
          duration: profile.enter.duration * durationScale,
          ease: profile.enter.ease,
        },
        initial ? 0.08 : 0.18,
      );
      timeline.set(overlay, { autoAlpha: 0 }, (profile.enter.duration + 0.28) * durationScale);

      await runTimeline(timeline);

      if (timelineRef.current === timeline) {
        timelineRef.current = null;
      }

      gsap.set(stage, {
        autoAlpha: 1,
        clearProps: "transform,filter,transformOrigin,willChange",
      });
      gsap.set(overlay, {
        clearProps: "filter",
      });
      gsap.set([panelPrimary, panelSecondary, accent, label], {
        clearProps: "transform,opacity,borderRadius,willChange",
      });

      phaseRef.current = "idle";
      setTransitioningState(false);

      if (queuedNavigationRef.current) {
        const queuedNavigation = queuedNavigationRef.current;
        queuedNavigationRef.current = null;
        await executeNavigation(queuedNavigation.href, queuedNavigation.mode);
      }
    },
    [cancelAnimations, executeNavigation, setOverlayCovered, setTransitioningState],
  );

  const push = useCallback(
    async (href: string) => {
      await executeNavigation(href, "push");
    },
    [executeNavigation],
  );

  const replace = useCallback(
    async (href: string) => {
      await executeNavigation(href, "replace");
    },
    [executeNavigation],
  );

  const refresh = useCallback(async () => {
    router.refresh();
  }, [router]);

  const transitionRouter = useMemo(
    () => ({ push, replace, refresh }),
    [push, replace, refresh],
  );

  useEffect(() => {
    activePathRef.current = pathname;
    activeSearchRef.current = search;
    activeRouteRef.current = routeKey;

    if (prefersReducedMotion()) {
      phaseRef.current = "idle";
      setTransitioningState(false);
      return;
    }

    const isInitialMount = !hasMountedRef.current;
    hasMountedRef.current = true;
    phaseRef.current = "entering";
    setTransitioningState(true);

    void animateIn(pathname, search, isInitialMount);

    return () => {
      cancelAnimations();
    };
  }, [animateIn, cancelAnimations, pathname, routeKey, search, setTransitioningState]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (anchor.dataset.transition === "false" || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      const nextRouteKey = buildRouteKey(url.pathname, url.search.replace(/^\?/, ""));
      const currentRouteKey = buildRouteKey(currentUrl.pathname, currentUrl.search.replace(/^\?/, ""));

      if (url.origin !== currentUrl.origin || nextRouteKey === currentRouteKey) {
        return;
      }

      event.preventDefault();
      void executeNavigation(`${url.pathname}${url.search}${url.hash}`, "push");
    };

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [executeNavigation]);

  return (
    <PageTransitionContext.Provider value={transitionRouter}>
      <div ref={shellRef} data-transitioning="false" className="page-transition-shell">
        <div ref={overlayRef} aria-hidden="true" className="page-transition-overlay">
          <div ref={panelPrimaryRef} className="page-transition-panel" />
          <div ref={panelSecondaryRef} className="page-transition-panel page-transition-panel-secondary" />
          <div className="page-transition-center">
            <div ref={accentRef} className="page-transition-accent" />
            <p ref={labelRef} className="page-transition-label" />
          </div>
        </div>
        <div ref={stageRef} className="page-transition-stage">
          {children}
        </div>
      </div>
    </PageTransitionContext.Provider>
  );
}