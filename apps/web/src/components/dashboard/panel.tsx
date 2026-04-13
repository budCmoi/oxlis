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
    <article className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className ?? ""}`.trim()}>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      <div className={`mt-3 space-y-3 ${contentClassName ?? ""}`.trim()}>{children}</div>
    </article>
  );
}
