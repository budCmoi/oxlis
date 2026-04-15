import Link from "next/link";
import { formatCurrency, formatListingStatus, truncateText } from "@/lib/format";
import { ActionButton } from "./action-button";

type DashboardListing = {
  id: string;
  title: string;
  askingPrice: number;
  status: string;
  _count: { offers: number };
};

type ListingManagementCardProps = {
  listing: DashboardListing;
  busy: boolean;
  onDelete: () => void;
};

export function ListingManagementCard({ listing, busy, onDelete }: ListingManagementCardProps) {
  const displayTitle = truncateText(listing.title, 20);

  return (
    <div className="studio-card px-4 py-4 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-nowrap sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <Link
            href={`/listings/${listing.id}`}
            title={listing.title}
            className="block truncate text-xl font-semibold text-slate-950 hover:text-slate-700"
          >
            {displayTitle}
          </Link>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {formatCurrency(listing.askingPrice)} · {listing._count.offers} offres
          </p>
          <span className="mt-3 inline-flex rounded-full border border-[var(--line)] bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
            {formatListingStatus(listing.status)}
          </span>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <Link
            href={`/dashboard/listings/${listing.id}`}
            className="rounded-full border border-[var(--line)] bg-white/75 px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-white"
          >
            Modifier
          </Link>
          <ActionButton busy={busy} variant="danger" onClick={onDelete}>
            Supprimer
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
