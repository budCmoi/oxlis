import { ReactNode } from "react";

type Props = {
  label: string;
  value: string | number;
  icon: ReactNode;
};

export function StatCard({ label, value, icon }: Props) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 inline-flex rounded-xl bg-teal-50 p-2 text-teal-700">{icon}</div>
      <p className="text-xs uppercase tracking-[0.11em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
    </article>
  );
}
