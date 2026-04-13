"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/auth/require-auth";
import { ListingForm, ListingFormValues } from "@/components/listings/listing-form";
import { apiRequest } from "@/lib/api";
import { buildListingDescription, parseMultiValueInput } from "@/lib/listing-editor";

export default function SellPage() {
  return (
    <RequireAuth>
      <SellContent />
    </RequireAuth>
  );
}

function SellContent() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [formVersion, setFormVersion] = useState(0);

  const submit = async (form: ListingFormValues) => {
    setStatus(null);

    try {
      await apiRequest<{ id: string }>("/listings", {
        method: "POST",
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
      setStatus("Annonce creee avec succes.");
      setFormVersion((current) => current + 1);
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Impossible de creer l'annonce");
    }
  };

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6 border-b border-slate-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Composer vendeur</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Creer une annonce complete et exploitable</h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
            Cette page reprend la logique d'une vraie fiche OXLIS: identite de l'actif, KPI, memo detaille et visuels.
            Vous pouvez maintenant construire une annonce bien plus complete, y compris sa galerie d'images.
          </p>
        </div>

        <ListingForm key={formVersion} submitLabel="Publier l'annonce" onSubmit={submit} status={status} />
      </section>
    </div>
  );
}
