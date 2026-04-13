export const listingMemoSections = [
  { key: "overview", title: "Vue d'ensemble" },
  { key: "economics", title: "Monetisation et revenus" },
  { key: "operations", title: "Operations et transfert" },
  { key: "growth", title: "Potentiel et leviers" },
] as const;

export type ListingMemoSectionKey = (typeof listingMemoSections)[number]["key"];

export type ListingMemoFields = Record<ListingMemoSectionKey, string>;

const sectionTitleByKey = Object.fromEntries(listingMemoSections.map((section) => [section.key, section.title])) as Record<
  ListingMemoSectionKey,
  string
>;

const keyByNormalizedTitle = Object.fromEntries(
  listingMemoSections.map((section) => [normalizeSectionTitle(section.title), section.key]),
) as Record<string, ListingMemoSectionKey>;

export function createEmptyMemoFields(): ListingMemoFields {
  return {
    overview: "",
    economics: "",
    operations: "",
    growth: "",
  };
}

export function buildListingDescription(fields: ListingMemoFields): string {
  return listingMemoSections
    .map((section) => ({
      title: sectionTitleByKey[section.key],
      body: fields[section.key].trim(),
    }))
    .filter((section) => section.body.length > 0)
    .map((section) => `${section.title}\n${section.body}`)
    .join("\n\n");
}

export function parseListingDescription(description: string): ListingMemoFields {
  const parsed = createEmptyMemoFields();
  const sections = description
    .split("\n\n")
    .map((section) => section.trim())
    .filter(Boolean);

  if (sections.length === 0) {
    return parsed;
  }

  const sequentialKeys = [...listingMemoSections.map((section) => section.key)];

  for (const rawSection of sections) {
    const [maybeHeading, ...bodyLines] = rawSection.split("\n");
    const normalizedHeading = normalizeSectionTitle(maybeHeading ?? "");
    const matchedKey = keyByNormalizedTitle[normalizedHeading];
    const body = bodyLines.join(" ").trim();

    if (matchedKey) {
      parsed[matchedKey] = body || maybeHeading.trim();
      continue;
    }

    const nextKey = sequentialKeys.find((key) => parsed[key].trim().length === 0);
    if (!nextKey) {
      continue;
    }

    parsed[nextKey] = rawSection.replace(/\s+/g, " ").trim();
  }

  return parsed;
}

export function parseMultiValueInput(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatMultiValueInput(values?: string[]): string {
  return values?.join("\n") ?? "";
}

function normalizeSectionTitle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}