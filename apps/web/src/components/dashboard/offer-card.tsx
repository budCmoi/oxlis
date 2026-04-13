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
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href={`/listings/${offer.listing?.id}`} className="font-medium text-slate-900 hover:text-teal-700">
            {offer.listing?.title ?? "Annonce sans titre"}
          </Link>
          <p className="mt-1 text-slate-700">{formatCurrency(offer.amount)}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-600">{formatOfferStatus(offer.status)}</span>
            {offer.escrow ? (
              <span className="rounded-full bg-teal-50 px-3 py-1 font-semibold text-teal-700">
                Sequestre {formatEscrowStatus(offer.escrow.status)}
              </span>
            ) : null}
          </div>
          {offer.message ? <p className="mt-2 text-slate-600">{offer.message}</p> : null}
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
