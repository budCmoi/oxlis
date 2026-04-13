import crypto from "node:crypto";

export const MAX_LISTING_IMAGES = 8;
export const MAX_LISTING_IMAGE_BYTES = 5 * 1024 * 1024;

const listingImageRoutePattern = /\/api\/uploads\/listing-images\/([^/?#]+)/i;

export function isSupportedListingImageMimeType(mimeType: string) {
  return mimeType.toLowerCase().startsWith("image/");
}

export function sanitizeListingImageName(originalName: string) {
  return (originalName || "listing-image")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/]+/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "listing-image";
}

export function hashListingImageContent(buffer: Buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function buildListingImageUrl(baseUrl: string, assetId: string) {
  return `${baseUrl}/api/uploads/listing-images/${assetId}`;
}

export function extractListingImageAssetId(imageUrl: string) {
  const directMatch = imageUrl.match(listingImageRoutePattern);
  if (directMatch) {
    return directMatch[1];
  }

  try {
    const parsedUrl = new URL(imageUrl);
    const nestedMatch = parsedUrl.pathname.match(listingImageRoutePattern);
    return nestedMatch?.[1] ?? null;
  } catch {
    return null;
  }
}