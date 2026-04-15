"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

    if (reducedMotion || coarsePointer) {
      document.documentElement.dataset.smoothScroll = "off";
      return;
    }

    const lenis = new Lenis({
      lerp: 0.085,
      duration: 1.15,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.92,
    });

    document.documentElement.dataset.smoothScroll = "on";
    lenis.on("scroll", ScrollTrigger.update);

    let frameId = 0;

    const raf = (time: number) => {
      lenis.raf(time);
      frameId = window.requestAnimationFrame(raf);
    };

    frameId = window.requestAnimationFrame(raf);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("resize", refresh);

    return () => {
      document.documentElement.dataset.smoothScroll = "off";
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", refresh);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [pathname, searchKey]);

  return <>{children}</>;
}