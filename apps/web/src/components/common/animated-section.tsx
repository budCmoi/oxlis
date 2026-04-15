"use client";

import { ReactNode, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  as?: "div" | "section" | "aside";
};

export function AnimatedSection({
  children,
  className,
  delay = 0,
  y = 36,
  once = true,
  as = "section",
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;

    if (!node || typeof window === "undefined") {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      return;
    }

    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

    const ctx = gsap.context(() => {
      const staggerTargets = node.querySelectorAll<HTMLElement>("[data-stagger-item]");
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: node,
          start: coarsePointer ? "top 92%" : "top 80%",
          once,
        },
      });

      timeline.fromTo(
        node,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          delay,
          duration: coarsePointer ? 0.56 : 0.84,
          ease: "power3.out",
          clearProps: "transform,opacity",
        },
      );

      if (staggerTargets.length > 0) {
        timeline.fromTo(
          staggerTargets,
          { opacity: 0, y: Math.max(16, y * 0.55) },
          {
            opacity: 1,
            y: 0,
            duration: coarsePointer ? 0.52 : 0.74,
            stagger: 0.08,
            ease: "power2.out",
            clearProps: "transform,opacity",
          },
          delay + 0.12,
        );
      }
    }, node);

    return () => ctx.revert();
  }, [delay, once, y]);

  if (as === "div") {
    return <div ref={ref as React.Ref<HTMLDivElement>} className={className} data-animated-section>{children}</div>;
  }

  if (as === "aside") {
    return <aside ref={ref as React.Ref<HTMLElement>} className={className} data-animated-section>{children}</aside>;
  }

  return <section ref={ref as React.Ref<HTMLElement>} className={className} data-animated-section>{children}</section>;
}
