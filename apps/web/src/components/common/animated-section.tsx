"use client";

import { ReactNode } from "react";

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
  as = "section",
}: Props) {

  if (as === "div") {
    return <div className={className}>{children}</div>;
  }

  if (as === "aside") {
    return <aside className={className}>{children}</aside>;
  }

  return <section className={className}>{children}</section>;
}
