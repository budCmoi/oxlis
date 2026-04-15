"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { ArrowDown, ArrowUp, Star, Trash2 } from "lucide-react";
import {
  buildListingDescription,
  formatMultiValueInput,
  ListingMemoFields,
  listingMemoSections,
  parseMultiValueInput,
} from "@/lib/listing-editor";
import { uploadListingImages } from "@/lib/api";

export type ListingFormValues = {
  title: string;
  summary: string;
  niche: string;
  type: string;
  status: "ACTIVE" | "DRAFT" | "SOLD";
  askingPrice: string;
  monthlyRevenue: string;
  monthlyProfit: string;
  techStack: string;
  imageUrls: string;
  memoOverview: string;
  memoEconomics: string;
  memoOperations: string;
  memoGrowth: string;
};

type ListingFormProps = {
  initialValues?: Partial<ListingFormValues>;
  submitLabel: string;
  onSubmit: (values: ListingFormValues) => Promise<void>;
  status?: string | null;
};

const defaultValues: ListingFormValues = {
  title: "",
  summary: "",
  niche: "SaaS",
  type: "Application web",
  status: "ACTIVE",
  askingPrice: "",
  monthlyRevenue: "",
  monthlyProfit: "",
  techStack: "Next.js,Node.js,PostgreSQL",
  imageUrls: "",
  memoOverview: "",
  memoEconomics: "",
  memoOperations: "",
  memoGrowth: "",
};

export function ListingForm({ initialValues, submitLabel, onSubmit, status }: ListingFormProps) {
  const [form, setForm] = useState<ListingFormValues>({
    ...defaultValues,
    ...initialValues,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<string | null>(null);

  const memoFields: ListingMemoFields = {
    overview: form.memoOverview,
    economics: form.memoEconomics,
    operations: form.memoOperations,
    growth: form.memoGrowth,
  };
  const imageUrls = parseMultiValueInput(form.imageUrls);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formError = validateListingForm(form);
    if (formError) {
      setValidationStatus(formError);
      return;
    }

    setValidationStatus(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        ...form,
        memoOverview: form.memoOverview.trim(),
        memoEconomics: form.memoEconomics.trim(),
        memoOperations: form.memoOperations.trim(),
        memoGrowth: form.memoGrowth.trim(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    setUploadStatus("Upload des images en cours...");

    try {
      const uploadedUrls = await uploadListingImages(files);
      setForm((prev) => ({
        ...prev,
        imageUrls: mergeMultiValueInput(prev.imageUrls, uploadedUrls),
      }));
      setUploadStatus(`${uploadedUrls.length} image(s) ajoutee(s) a la galerie.`);
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : "Impossible d'uploader les images.");
    } finally {
      event.target.value = "";
    }
  };

  const handleImageReorder = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= imageUrls.length) {
      return;
    }

    const nextImages = [...imageUrls];
    [nextImages[index], nextImages[nextIndex]] = [nextImages[nextIndex], nextImages[index]];
    setImageUrls(nextImages);
  };

  const handleImagePromote = (index: number) => {
    if (index <= 0 || index >= imageUrls.length) {
      return;
    }

    const nextImages = [imageUrls[index], ...imageUrls.filter((_, currentIndex) => currentIndex !== index)];
    setImageUrls(nextImages);
  };

  const handleImageRemove = (index: number) => {
    setImageUrls(imageUrls.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleImageUrlsChange = (value: string) => {
    setForm((prev) => ({ ...prev, imageUrls: value }));
  };

  const setImageUrls = (nextValues: string[]) => {
    setForm((prev) => ({
      ...prev,
      imageUrls: formatMultiValueInput(nextValues),
    }));
  };

  return (
    <div className="mt-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="studio-panel px-5 py-5 sm:px-6">
          <div className="mb-4">
            <p className="studio-kicker">Identite de l'actif</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">Base de l'annonce</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              aria-label="Titre de l'entreprise"
              required
              minLength={4}
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: QuestLoop Studios"
              className="md:col-span-2 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
            />
            <input
              aria-label="Resume court"
              required
              minLength={10}
              value={form.summary}
              onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
              placeholder="Resume vendeur en une phrase claire"
              className="md:col-span-2 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
            />
            <input
              aria-label="Niche"
              required
              minLength={2}
              value={form.niche}
              onChange={(e) => setForm((prev) => ({ ...prev, niche: e.target.value }))}
              placeholder="Ex: Gaming"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
            />
            <input
              aria-label="Type"
              required
              minLength={2}
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
              placeholder="Ex: Game"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
            />
            <select
              aria-label="Statut de l'annonce"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ListingFormValues["status"] }))}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
            >
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Brouillon</option>
              <option value="SOLD">Vendue</option>
            </select>
            <input
              aria-label="Stack technique"
              required
              value={form.techStack}
              onChange={(e) => setForm((prev) => ({ ...prev, techStack: e.target.value }))}
              placeholder="Next.js, Node.js, PostgreSQL"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
            />
          </div>
        </section>

        <section className="studio-panel px-5 py-5 sm:px-6">
          <div className="mb-4">
            <p className="studio-kicker">KPIs et valorisation</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">Les chiffres clefs de l'actif</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <input
              type="number"
              aria-label="Prix demande"
              required
              min={1}
              value={form.askingPrice}
              onChange={(e) => setForm((prev) => ({ ...prev, askingPrice: e.target.value }))}
              placeholder="Prix demande"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
            />
            <input
              type="number"
              aria-label="Revenu mensuel"
              required
              min={0}
              value={form.monthlyRevenue}
              onChange={(e) => setForm((prev) => ({ ...prev, monthlyRevenue: e.target.value }))}
              placeholder="CA mensuel"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
            />
            <input
              type="number"
              aria-label="Profit mensuel"
              required
              min={0}
              value={form.monthlyProfit}
              onChange={(e) => setForm((prev) => ({ ...prev, monthlyProfit: e.target.value }))}
              placeholder="Profit mensuel"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
            />
          </div>
        </section>

        <section className="studio-panel px-5 py-5 sm:px-6">
          <div className="mb-4">
            <p className="studio-kicker">Memo detaille</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">Redigez une vraie fiche investisseur</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Ces sections servent a construire automatiquement la description detaillee de l'annonce comme sur la fiche publique.
            </p>
          </div>

          <div className="grid gap-4">
            {listingMemoSections.map((section) => (
              <div key={section.key}>
                <label className="mb-2 block text-sm font-semibold text-slate-900">{section.title}</label>
                <textarea
                  aria-label={section.title}
                  rows={5}
                  minLength={section.key === "overview" ? 30 : undefined}
                  value={memoFields[section.key]}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [getMemoFieldName(section.key)]: e.target.value,
                    }))
                  }
                  placeholder={`Detaillez la section ${section.title.toLowerCase()} avec un niveau vendeur serieux et credible.`}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="studio-panel px-5 py-5 sm:px-6">
          <div className="mb-4">
            <p className="studio-kicker">Visuels de l'annonce</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">Ajoutez votre galerie</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Uploadez vos fichiers ou collez une image par ligne. Les chemins publics du type /listing-saas.svg et les URLs http(s) sont acceptes.
            </p>
          </div>

          <div className="mb-4 rounded-[1.4rem] border border-dashed border-[var(--line)] bg-white/70 p-4">
            <label className="block text-sm font-semibold text-slate-950">Importer des images depuis votre appareil</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="mt-3 block w-full text-sm text-slate-600"
            />
            {uploadStatus ? <p className="mt-3 text-sm text-slate-600">{uploadStatus}</p> : null}
          </div>

          <textarea
            aria-label="URLs des images"
            value={form.imageUrls}
            onChange={(e) => handleImageUrlsChange(e.target.value)}
            placeholder={"/listing-saas.svg\n/listing-overview.svg\nhttps://..."}
            rows={6}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-400 focus:ring"
          />

          {imageUrls.length > 0 ? (
            <div className="mt-4 space-y-3 rounded-[1.4rem] border border-[var(--line)] bg-white/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Galerie courante</p>
                  <p className="mt-1 text-xs text-slate-500">La premiere image devient la couverture sur les cartes et la fiche detail.</p>
                </div>
                <span className="rounded-full border border-[var(--line)] bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600">{imageUrls.length} image(s)</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {imageUrls.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    data-testid={`listing-image-item-${index}`}
                    className="studio-card p-3"
                  >
                    <div className="relative overflow-hidden rounded-[1rem] border border-[var(--line)] bg-slate-900">
                      <div className="aspect-[16/10] w-full">
                        <img src={src} alt={`Apercu galerie ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                      </div>
                      {index === 0 ? (
                        <div className="absolute left-2 top-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--accent-ink)]">
                          Couverture
                        </div>
                      ) : null}
                    </div>

                    <p className="mt-3 truncate text-xs text-slate-500">{src}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleImagePromote(index)}
                        disabled={index === 0}
                        data-testid={`listing-image-promote-${index}`}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Star className="h-3.5 w-3.5" />
                        Couverture
                      </button>
                      <button
                        type="button"
                        onClick={() => handleImageReorder(index, -1)}
                        disabled={index === 0}
                        data-testid={`listing-image-up-${index}`}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                        Monter
                      </button>
                      <button
                        type="button"
                        onClick={() => handleImageReorder(index, 1)}
                        disabled={index === imageUrls.length - 1}
                        data-testid={`listing-image-down-${index}`}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                        Descendre
                      </button>
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        data-testid={`listing-image-remove-${index}`}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <div className="studio-shell px-5 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">Pret a publier votre actif</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Le formulaire couvre maintenant les KPIs, le memo detaille et les visuels de la fiche.</p>
            </div>

            <button
              disabled={isSubmitting}
              data-testid="listing-submit"
              className="studio-button-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Enregistrement..." : submitLabel}
            </button>
          </div>

          {validationStatus ? <p className="mt-4 text-sm text-rose-600">{validationStatus}</p> : null}
          {!validationStatus && status ? <p className="mt-4 text-sm text-slate-600">{status}</p> : null}
        </div>
      </form>
    </div>
  );
}

function getMemoFieldName(key: keyof ListingMemoFields): keyof ListingFormValues {
  const map = {
    overview: "memoOverview",
    economics: "memoEconomics",
    operations: "memoOperations",
    growth: "memoGrowth",
  } satisfies Record<keyof ListingMemoFields, keyof ListingFormValues>;

  return map[key];
}

function mergeMultiValueInput(existingValue: string, nextValues: string[]) {
  const existingItems = parseMultiValueInput(existingValue);
  const merged = [...new Set([...existingItems, ...nextValues])];
  return merged.join("\n");
}

function validateListingForm(form: ListingFormValues) {
  const description = buildListingDescription({
    overview: form.memoOverview,
    economics: form.memoEconomics,
    operations: form.memoOperations,
    growth: form.memoGrowth,
  }).trim();

  if (form.title.trim().length < 4) {
    return "Le titre doit contenir au moins 4 caracteres.";
  }

  if (form.summary.trim().length < 10) {
    return "Le resume doit contenir au moins 10 caracteres.";
  }

  if (form.niche.trim().length < 2 || form.type.trim().length < 2) {
    return "La niche et le type doivent contenir au moins 2 caracteres.";
  }

  if (!Number.isFinite(Number(form.askingPrice)) || Number(form.askingPrice) <= 0) {
    return "Le prix demande doit etre superieur a 0.";
  }

  if (!Number.isFinite(Number(form.monthlyRevenue)) || Number(form.monthlyRevenue) < 0) {
    return "Le revenu mensuel doit etre un nombre valide superieur ou egal a 0.";
  }

  if (!Number.isFinite(Number(form.monthlyProfit)) || Number(form.monthlyProfit) < 0) {
    return "Le profit mensuel doit etre un nombre valide superieur ou egal a 0.";
  }

  if (parseMultiValueInput(form.techStack).length === 0) {
    return "Ajoutez au moins une technologie dans la stack.";
  }

  if (description.length < 30) {
    return "Ajoutez au moins une section de memo detaillee pour atteindre 30 caracteres minimum.";
  }

  const imageUrls = parseMultiValueInput(form.imageUrls);
  if (imageUrls.length > 10) {
    return "La galerie est limitee a 10 images.";
  }

  const invalidImage = imageUrls.find((value) => !value.startsWith("/") && !/^https?:\/\//i.test(value));
  if (invalidImage) {
    return "Chaque image doit etre un chemin /public ou une URL http(s).";
  }

  return null;
}
