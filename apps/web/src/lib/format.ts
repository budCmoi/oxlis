export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export const formatCompact = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const listingStatusLabels = {
  ACTIVE: "Active",
  SOLD: "Vendue",
  DRAFT: "Brouillon",
} as const;

const offerStatusLabels = {
  PENDING: "En attente",
  ACCEPTED: "Acceptee",
  REJECTED: "Refusee",
  COUNTERED: "Contre-offre",
} as const;

const escrowStatusLabels = {
  INITIATED: "Ouvert",
  FUNDED: "Finance",
  RELEASED: "Libere",
  CANCELLED: "Annule",
} as const;

export const formatListingStatus = (status: string) =>
  listingStatusLabels[status as keyof typeof listingStatusLabels] ?? status;

export const formatOfferStatus = (status: string) =>
  offerStatusLabels[status as keyof typeof offerStatusLabels] ?? status;

export const formatEscrowStatus = (status: string) =>
  escrowStatusLabels[status as keyof typeof escrowStatusLabels] ?? status;
