import { ReactNode } from "react";

type PanelProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function Panel({ title, subtitle, children, className, contentClassName }: PanelProps) {
  return (
    <article className={`studio-panel px-4 py-4 sm:px-5 ${className ?? ""}`.trim()}>
      <p className="studio-kicker !text-[0.62rem] !tracking-[0.18em]">Section</p>
      <h2 className="mt-3 text-2xl font-semibold text-slate-950">{title}</h2>
      {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p> : null}
      <div className={`mt-3 space-y-3 ${contentClassName ?? ""}`.trim()}>{children}</div>
    </article>
  );
}
