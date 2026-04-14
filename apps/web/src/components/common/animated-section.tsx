"use client";

import { ReactNode, useEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";

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
  y = 24,
  once = true,
  as = "section",
}: Props) {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      gsap.set(element, { autoAlpha: 1, y: 0 });
      return;
    }

    gsap.set(element, { autoAlpha: 0, y });

    let hasPlayed = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }

        if (entry.isIntersecting) {
          hasPlayed = true;
          gsap.to(element, {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            delay,
            ease: "power3.out",
            overwrite: "auto",
            clearProps: "transform",
          });

          if (once) {
            observer.unobserve(element);
          }

          return;
        }

        if (!once && hasPlayed) {
          gsap.to(element, {
            autoAlpha: 0.3,
            y: Math.max(8, y / 2),
            duration: 0.25,
            ease: "power2.out",
            overwrite: "auto",
          });
        }
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      gsap.killTweensOf(element);
    };
  }, [delay, once, y]);

  if (as === "div") {
    return (
      <div ref={rootRef as RefObject<HTMLDivElement>} className={className}>
        {children}
      </div>
    );
  }

  if (as === "aside") {
    return (
      <aside ref={rootRef as RefObject<HTMLElement>} className={className}>
        {children}
      </aside>
    );
  }

  return (
    <section ref={rootRef as RefObject<HTMLElement>} className={className}>
      {children}
    </section>
  );
}
