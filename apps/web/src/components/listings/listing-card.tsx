import Link from "next/link";
import { Activity, DollarSign, Layers, TrendingUp } from "lucide-react";
import { ListingVisual } from "@/components/listings/listing-visual";
import { formatCompact, formatCurrency, formatListingStatus, truncateText } from "@/lib/format";
import { Listing } from "@/types";

type Props = {
  listing: Listing;
};

export function ListingCard({ listing }: Props) {
  const displayMeta = truncateText(`${listing.niche} · ${listing.type}`, 32);
  const displayTitle = truncateText(listing.title, 23);
  const displaySummary = truncateText(listing.summary, 50);
  const askingPrice = formatCurrency(listing.askingPrice);
  const monthlyRevenue = `${formatCurrency(listing.monthlyRevenue)}/mo`;
  const monthlyProfit = `${formatCurrency(listing.monthlyProfit)}/mo`;
  const offersCount = `${formatCompact(listing._count?.offers ?? 0)} offres`;

  return (
    <article
      data-testid={`listing-card-${listing.id}`}
      className="group flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-5"
    >
      <ListingVisual listing={listing} />

      <div className="mb-4 mt-4 flex items-start justify-between gap-3 sm:mt-5 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p title={`${listing.niche} · ${listing.type}`} className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {displayMeta}
          </p>
          <h3 title={listing.title} className="mt-1 min-h-[1.5rem] truncate text-lg font-semibold text-slate-900 sm:min-h-[1.75rem] sm:text-xl">
            {displayTitle}
          </h3>
          <p title={listing.summary} className="mt-2 min-h-[2.5rem] overflow-hidden break-words text-sm leading-6 text-slate-600">
            {displaySummary}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{formatListingStatus(listing.status)}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <div className="flex min-w-0 items-center gap-2 text-slate-700">
          <DollarSign className="h-4 w-4 shrink-0 text-teal-600" />
          <span title={askingPrice} className="min-w-0 truncate">
            {askingPrice}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-slate-700">
          <TrendingUp className="h-4 w-4 shrink-0 text-teal-600" />
          <span title={monthlyRevenue} className="min-w-0 truncate">
            {monthlyRevenue}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-slate-700">
          <Activity className="h-4 w-4 shrink-0 text-teal-600" />
          <span title={monthlyProfit} className="min-w-0 truncate">
            {monthlyProfit}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-slate-700">
          <Layers className="h-4 w-4 shrink-0 text-teal-600" />
          <span title={offersCount} className="min-w-0 truncate">
            {offersCount}
          </span>
        </div>
      </div>

      <div className="mt-4 flex min-h-[3.5rem] flex-wrap content-start gap-2">
        {listing.techStack.slice(0, 3).map((item) => (
          <span key={item} title={item} className="max-w-full truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
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
