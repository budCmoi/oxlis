import Link from "next/link";
import { Activity, ArrowUpRight, DollarSign, Layers, TrendingUp } from "lucide-react";
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
      className="group studio-card flex h-full min-w-0 flex-col p-3 transition hover:-translate-y-1.5 sm:p-4"
    >
      <ListingVisual listing={listing} />

      <div className="mb-4 mt-4 flex items-start justify-between gap-3 sm:mt-5 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p title={`${listing.niche} · ${listing.type}`} className="studio-kicker truncate !text-[0.62rem] !tracking-[0.16em]">
            {displayMeta}
          </p>
          <h3 title={listing.title} className="mt-2 min-h-[1.5rem] truncate text-2xl font-semibold text-slate-950 sm:min-h-[1.75rem]">
            {displayTitle}
          </h3>
          <p title={listing.summary} className="mt-3 min-h-[2.5rem] overflow-hidden break-words text-sm leading-6 text-slate-600">
            {displaySummary}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[var(--line)] bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
          {formatListingStatus(listing.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-[1.45rem] border border-[var(--line)] bg-white/55 p-4 text-sm sm:grid-cols-2">
        <div className="flex min-w-0 items-center gap-2 text-slate-700">
          <DollarSign className="h-4 w-4 shrink-0 text-[color:var(--warm)]" />
          <span title={askingPrice} className="min-w-0 truncate">
            {askingPrice}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-slate-700">
          <TrendingUp className="h-4 w-4 shrink-0 text-[color:var(--warm)]" />
          <span title={monthlyRevenue} className="min-w-0 truncate">
            {monthlyRevenue}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-slate-700">
          <Activity className="h-4 w-4 shrink-0 text-[color:var(--warm)]" />
          <span title={monthlyProfit} className="min-w-0 truncate">
            {monthlyProfit}
          </span>
        </div>
        <div className="flex min-w-0 items-center gap-2 text-slate-700">
          <Layers className="h-4 w-4 shrink-0 text-[color:var(--warm)]" />
          <span title={offersCount} className="min-w-0 truncate">
            {offersCount}
          </span>
        </div>
      </div>

      <div className="mt-4 flex min-h-[3.5rem] flex-wrap content-start gap-2">
        {listing.techStack.slice(0, 3).map((item) => (
          <span key={item} title={item} className="max-w-full truncate rounded-full border border-[var(--line)] bg-white/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
            {item}
          </span>
        ))}
      </div>

      <Link
        href={`/listings/${listing.id}`}
        aria-label={`Voir le detail de ${listing.title}`}
        className="studio-button-secondary mt-auto w-fit pt-5 text-sm text-slate-900 group-hover:border-[color:var(--accent-strong)] group-hover:bg-white"
      >
        Voir le detail
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
