"use client";

import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function AnimatedSection({ children, className }: Props) {
  return <section className={className}>{children}</section>;
}
