import { ReactNode } from "react";

type Props = {
  label: string;
  value: string | number;
  icon: ReactNode;
};

export function StatCard({ label, value, icon }: Props) {
  return (
    <article className="studio-card px-4 py-4 sm:px-5">
      <div className="mb-4 inline-flex rounded-2xl bg-[linear-gradient(135deg,#14110f,#2b241b)] p-3 text-lime-300 shadow-sm">
        {icon}
      </div>
      <p className="studio-kicker !text-[0.62rem] !tracking-[0.18em]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-slate-950">{value}</p>
    </article>
  );
}
