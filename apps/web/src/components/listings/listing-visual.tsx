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
    ? "object-cover transition duration-500 group-hover:scale-[1.03]"
    : "scale-[1.02] object-cover blur-[3px] transition duration-500 group-hover:scale-[1.05]";

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
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-slate-950/5" />

          <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
              {visual.label}
            </span>
            <span className="rounded-full border border-teal-300/25 bg-teal-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-100 backdrop-blur-sm">
              {listing.type}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{listing.niche}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{listing.title}</p>
              <p className="mt-2 max-w-xl text-sm text-slate-200/90">{listing.summary}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white sm:text-sm">
              <MetricPill label="Prix" value={formatCurrency(listing.askingPrice)} />
              <MetricPill label="CA/mo" value={formatCurrency(listing.monthlyRevenue)} />
              <MetricPill label="Profit/mo" value={formatCurrency(listing.monthlyProfit)} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/15 bg-slate-950/35 px-3 py-1.5 backdrop-blur-sm">
      <span className="text-slate-300">{label}</span>
      <span className="ml-2 font-semibold text-white">{value}</span>
    </span>
  );
}