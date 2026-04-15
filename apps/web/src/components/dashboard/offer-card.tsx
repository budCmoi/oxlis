import Link from "next/link";
import { formatCurrency, formatEscrowStatus, formatOfferStatus } from "@/lib/format";
import { Offer } from "@/types";
import { ActionButton } from "./action-button";

type OfferCardProps = {
  offer: Offer;
  busy: boolean;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  tertiaryAction?: { label: string; onClick: () => void };
};

export function OfferCard({ offer, busy, primaryAction, secondaryAction, tertiaryAction }: OfferCardProps) {
  return (
    <div className="studio-card px-4 py-4 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href={`/listings/${offer.listing?.id}`} className="text-xl font-semibold text-slate-950 hover:text-slate-700">
            {offer.listing?.title ?? "Annonce sans titre"}
          </Link>
          <p className="mt-2 text-base font-semibold text-slate-800">{formatCurrency(offer.amount)}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1.5 font-semibold uppercase tracking-[0.12em] text-slate-600">{formatOfferStatus(offer.status)}</span>
            {offer.escrow ? (
              <span className="rounded-full border border-lime-300/35 bg-lime-300/14 px-3 py-1.5 font-semibold uppercase tracking-[0.12em] text-lime-800">
                Sequestre {formatEscrowStatus(offer.escrow.status)}
              </span>
            ) : null}
          </div>
          {offer.message ? <p className="mt-3 text-sm leading-6 text-slate-600">{offer.message}</p> : null}
        </div>

        {primaryAction || secondaryAction || tertiaryAction ? (
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {primaryAction ? (
              <ActionButton busy={busy} variant="primary" onClick={primaryAction.onClick}>
                {primaryAction.label}
              </ActionButton>
            ) : null}
            {secondaryAction ? (
              <ActionButton busy={busy} variant="secondary" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </ActionButton>
            ) : null}
            {tertiaryAction ? (
              <ActionButton busy={busy} variant="ghost" onClick={tertiaryAction.onClick}>
                {tertiaryAction.label}
              </ActionButton>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
