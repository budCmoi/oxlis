import { ReactNode } from "react";

type ActionButtonProps = {
  busy: boolean;
  children: ReactNode;
  onClick: () => void;
  variant: "primary" | "secondary" | "ghost" | "danger";
};

export function ActionButton({ busy, children, onClick, variant }: ActionButtonProps) {
  const className =
    variant === "primary"
      ? "border border-[rgba(17,22,7,0.08)] bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-[color:var(--accent-ink)] shadow-sm"
      : variant === "secondary"
        ? "border border-[var(--line)] bg-white/75 text-slate-800 hover:-translate-y-0.5 hover:bg-white"
        : variant === "danger"
          ? "border border-rose-200 bg-rose-50 text-rose-700 hover:-translate-y-0.5 hover:bg-rose-100"
          : "border border-[var(--line)] bg-[rgba(20,17,15,0.05)] text-slate-700 hover:-translate-y-0.5 hover:bg-[rgba(20,17,15,0.08)]";

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`rounded-full px-3.5 py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {busy ? "Traitement..." : children}
    </button>
  );
}
