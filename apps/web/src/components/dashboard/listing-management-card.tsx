import Link from "next/link";
import { formatCurrency, formatListingStatus } from "@/lib/format";
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
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href={`/listings/${listing.id}`} className="font-medium text-slate-900 hover:text-teal-700">
            {listing.title}
          </Link>
          <p className="mt-1 text-slate-600">
            {formatCurrency(listing.askingPrice)} · {listing._count.offers} offres
          </p>
          <span className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            {formatListingStatus(listing.status)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Link
            href={`/dashboard/listings/${listing.id}`}
            className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-800 ring-1 ring-slate-300 transition hover:bg-slate-100"
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
