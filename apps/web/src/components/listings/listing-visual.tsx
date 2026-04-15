import Image from "next/image";
import { formatCurrency } from "@/lib/format";
import { getListingVisual } from "@/lib/listing-visuals";
import { Listing } from "@/types";

type ListingVisualProps = {
  listing: Pick<
    Listing,
    "title" | "summary" | "type" | "niche" | "techStack" | "askingPrice" | "monthlyRevenue" | "monthlyProfit" | "imageUrls"
  >;
  variant?: "card" | "detail";
};

export function ListingVisual({ listing, variant = "card" }: ListingVisualProps) {
  const visual = getListingVisual(listing);
  const isDetail = variant === "detail";
  const isRemoteVisual = /^https?:\/\//i.test(visual.src);
  const imageClassName = isDetail
    ? "object-cover transition duration-700 group-hover:scale-[1.04]"
    : "object-cover transition duration-700 group-hover:scale-[1.08]";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 ${
        isDetail ? "aspect-[16/9]" : "aspect-[16/10]"
      }`}
    >
      <Image
        src={visual.src}
        alt={`Apercu visuel de ${listing.title}`}
        fill
        sizes={isDetail ? "(max-width: 1024px) 100vw, 720px" : "(max-width: 768px) 100vw, 420px"}
        className={imageClassName}
        priority={isDetail}
        unoptimized={isRemoteVisual}
      />

      {isDetail ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a07] via-[#0c0a07]/35 to-transparent" />

          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
              {visual.label}
            </span>
            <span className="rounded-full border border-lime-300/18 bg-lime-300/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-lime-100 backdrop-blur-sm">
              {listing.type}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.16em] text-white/64">{listing.niche}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{listing.title}</p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/82">{listing.summary}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white sm:text-sm">
              <MetricPill label="Prix" value={formatCurrency(listing.askingPrice)} />
              <MetricPill label="CA/mo" value={formatCurrency(listing.monthlyRevenue)} />
              <MetricPill label="Profit/mo" value={formatCurrency(listing.monthlyProfit)} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a07] via-[#0c0a07]/22 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
              {visual.label}
            </span>
            <span className="rounded-full border border-lime-300/18 bg-lime-300/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-lime-100 backdrop-blur-sm">
              {listing.niche}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/56">{listing.type}</p>
              <p className="mt-2 text-sm font-semibold text-white">{formatCurrency(listing.askingPrice)}</p>
            </div>

            <div className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/72 backdrop-blur-sm">
              {listing.techStack.slice(0, 2).join(" · ")}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
      <span className="text-white/62">{label}</span>
      <span className="ml-2 font-semibold text-white">{value}</span>
    </span>
  );
}