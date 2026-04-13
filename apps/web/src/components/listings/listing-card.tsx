import Link from "next/link";
import { Activity, DollarSign, Layers, TrendingUp } from "lucide-react";
import { ListingVisual } from "@/components/listings/listing-visual";
import { formatCompact, formatCurrency, formatListingStatus } from "@/lib/format";
import { Listing } from "@/types";

type Props = {
  listing: Listing;
};

export function ListingCard({ listing }: Props) {
  return (
    <article
      data-testid={`listing-card-${listing.id}`}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <ListingVisual listing={listing} />

      <div className="mt-5 mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {listing.niche} · {listing.type}
          </p>
          <h3 className="mt-1 line-clamp-2 min-h-[3.5rem] text-xl font-semibold text-slate-900">{listing.title}</h3>
          <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm text-slate-600">{listing.summary}</p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{formatListingStatus(listing.status)}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
        <div className="flex items-center gap-2 text-slate-700">
          <DollarSign className="h-4 w-4 text-teal-600" />
          <span>{formatCurrency(listing.askingPrice)}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <TrendingUp className="h-4 w-4 text-teal-600" />
          <span>{formatCurrency(listing.monthlyRevenue)}/mo</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <Activity className="h-4 w-4 text-teal-600" />
          <span>{formatCurrency(listing.monthlyProfit)}/mo</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <Layers className="h-4 w-4 text-teal-600" />
          <span>{formatCompact(listing._count?.offers ?? 0)} offres</span>
        </div>
      </div>

      <div className="mt-4 flex min-h-[3.5rem] flex-wrap content-start gap-2">
        {listing.techStack.slice(0, 3).map((item) => (
          <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {item}
          </span>
        ))}
      </div>

      <Link
        href={`/listings/${listing.id}`}
        aria-label={`Voir le detail de ${listing.title}`}
        className="mt-auto pt-5 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-teal-600"
      >
        Voir le detail
      </Link>
    </article>
  );
}
