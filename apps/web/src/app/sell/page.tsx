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
    <div className="page-shell page-stack pt-4 sm:pt-6">
      <section className="studio-shell px-5 py-6 sm:px-6 sm:py-7 lg:px-8">
        <div className="mb-5 border-b border-[var(--line)] pb-5 sm:mb-6 sm:pb-6">
          <p className="studio-kicker">Composer vendeur</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">Creer une annonce complete et exploitable</h1>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600 sm:text-base">
            Cette page reprend la logique d&apos;une vraie fiche OXLIS: identite de l&apos;actif, KPI, memo detaille et visuels.
            Vous pouvez maintenant construire une annonce bien plus complete, y compris sa galerie d&apos;images.
          </p>
        </div>

        <ListingForm key={formVersion} submitLabel="Publier l&apos;annonce" onSubmit={submit} status={status} />
      </section>
    </div>
  );
}
