"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePageTransitionRouter } from "@/components/common/page-transition-shell";
import { RequireAuth } from "@/components/auth/require-auth";
import { useAuth } from "@/components/providers/auth-provider";
import { ListingForm, ListingFormValues } from "@/components/listings/listing-form";
import { apiRequest } from "@/lib/api";
import { buildListingDescription, formatMultiValueInput, parseListingDescription, parseMultiValueInput } from "@/lib/listing-editor";
import { Listing } from "@/types";

export default function EditListingPage() {
  return (
    <RequireAuth>
      <EditListingContent />
    </RequireAuth>
  );
}

function EditListingContent() {
  const { id } = useParams<{ id: string }>();
  const { push, replace } = usePageTransitionRouter();
  const { user, isLoading } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<Listing>(`/listings/${id}`)
      .then(setListing)
      .catch((err: Error) => setStatus(err.message));
  }, [id]);

  useEffect(() => {
    if (!isLoading && listing && user?.id !== listing.owner.id) {
      void replace("/dashboard");
    }
  }, [isLoading, listing, replace, user?.id]);

  const submit = async (form: ListingFormValues) => {
    setStatus(null);

    try {
      await apiRequest(`/listings/${id}`, {
        method: "PUT",
        auth: true,
        body: {
          title: form.title,
          summary: form.summary,
          description: buildListingDescription({
            overview: form.memoOverview,
            economics: form.memoEconomics,
            operations: form.memoOperations,
            growth: form.memoGrowth,
          }),
          imageUrls: parseMultiValueInput(form.imageUrls),
          niche: form.niche,
          type: form.type,
          status: form.status,
          askingPrice: Number(form.askingPrice),
          monthlyRevenue: Number(form.monthlyRevenue),
          monthlyProfit: Number(form.monthlyProfit),
          techStack: parseMultiValueInput(form.techStack),
        },
      });
      setStatus("Annonce mise a jour avec succes.");
      await push("/dashboard");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Impossible de mettre a jour l'annonce");
    }
  };

  if (!listing) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-500">Chargement de l&apos;editeur d&apos;annonce...</p>;
  }

  const memoFields = parseListingDescription(listing.description);

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Modifier l&apos;annonce</h1>
            <p className="mt-1 text-sm text-slate-600">Mettez a jour les metriques, le positionnement et la stack technique de cet actif.</p>
          </div>
          <Link href="/dashboard" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Retour
          </Link>
        </div>

        <ListingForm
          submitLabel="Enregistrer les modifications"
          status={status}
          initialValues={{
            title: listing.title,
            summary: listing.summary,
            niche: listing.niche,
            type: listing.type,
            status: listing.status,
            askingPrice: String(listing.askingPrice),
            monthlyRevenue: String(listing.monthlyRevenue),
            monthlyProfit: String(listing.monthlyProfit),
            techStack: formatMultiValueInput(listing.techStack),
            imageUrls: formatMultiValueInput(listing.imageUrls),
            memoOverview: memoFields.overview,
            memoEconomics: memoFields.economics,
            memoOperations: memoFields.operations,
            memoGrowth: memoFields.growth,
          }}
          onSubmit={submit}
        />
      </section>
    </div>
  );
}
