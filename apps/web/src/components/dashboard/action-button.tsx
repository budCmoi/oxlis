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
      ? "bg-slate-900 text-white hover:bg-teal-600"
      : variant === "secondary"
        ? "bg-white text-slate-800 ring-1 ring-slate-300 hover:bg-slate-100"
        : variant === "danger"
          ? "bg-red-50 text-red-700 hover:bg-red-100"
          : "bg-amber-50 text-amber-800 hover:bg-amber-100";

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`rounded-full px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {busy ? "Traitement..." : children}
    </button>
  );
}
