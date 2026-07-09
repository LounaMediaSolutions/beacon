import type { ContactProfile } from "../types";

/** A minimal profile shape sufficient to build a vCard and links. */
export type VCardProfile = Pick<
  ContactProfile,
  | "slug"
  | "name"
  | "title"
  | "company"
  | "phone"
  | "email"
  | "website"
  | "linkedin"
  | "location"
  | "portraitUrl"
>;

/** A portrait to embed in a vCard, base64-encoded with its image type. */
export interface VCardPhoto {
  base64: string;
  /** vCard TYPE token, e.g. "JPEG" or "PNG". */
  type: string;
}

/**
 * Convert arbitrary text to a lowercase, URL-safe slug.
 * Lowercase, trim, NFD-normalise, strip accents, replace non [a-z0-9] runs with
 * "-", trim leading/trailing "-".
 */
export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Keep digits and a single leading "+" for use in a tel: href. */
export function phoneHref(phone: string): string {
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

/** Digits only, for wa.me links. */
export function whatsappNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Absolute shareable URL for a card. */
export function contactUrl(slug: string): string {
  const origin =
    typeof window !== "undefined" && window.location
      ? window.location.origin
      : "";
  return `${origin}/contact/${slug}`;
}

/** Split a display name into first and last components. */
function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return { first: parts[0], last: "" };
  }
  const last = parts[parts.length - 1];
  const first = parts.slice(0, -1).join(" ");
  return { first, last };
}

/** Escape a value for a vCard property per RFC 6350. */
function esc(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Fold a long vCard line to 75 octets per RFC 6350, with each continuation
 * beginning with a single space. Used for the base64 PHOTO payload.
 */
function foldLine(line: string): string {
  const max = 75;
  if (line.length <= max) {
    return line;
  }
  const chunks: string[] = [line.slice(0, max)];
  let rest = line.slice(max);
  while (rest.length > 0) {
    chunks.push(rest.slice(0, max - 1));
    rest = rest.slice(max - 1);
  }
  return chunks.join("\r\n ");
}

/** Options for building a vCard. */
export interface VCardOptions {
  /**
   * A remote photo URL to reference (PHOTO;VALUE=URI) instead of embedding
   * bytes. Kept small enough for a QR payload. Note that many contact apps
   * (notably iOS) do not fetch remote photo URLs, so this is a best-effort
   * bonus, not a guarantee the picture appears.
   */
  photoUrl?: string;
}

/** Build an RFC 6350 vCard 3.0 text document. Lines joined with CRLF. */
export function buildVCard(
  profile: VCardProfile,
  photo?: VCardPhoto,
  options?: VCardOptions,
): string {
  const { first, last } = splitName(profile.name);
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0"];

  lines.push(`N:${esc(last)};${esc(first)};;;`);
  lines.push(`FN:${esc(profile.name)}`);

  if (profile.company) {
    lines.push(`ORG:${esc(profile.company)}`);
  }
  if (profile.title) {
    lines.push(`TITLE:${esc(profile.title)}`);
  }
  if (profile.phone) {
    lines.push(`TEL;TYPE=CELL:${esc(phoneHref(profile.phone))}`);
  }
  if (profile.email) {
    lines.push(`EMAIL;TYPE=WORK:${esc(profile.email)}`);
  }
  if (profile.website) {
    lines.push(`URL:${esc(profile.website)}`);
  }
  if (profile.linkedin) {
    lines.push(`URL;TYPE=LinkedIn:${esc(profile.linkedin)}`);
  }
  if (profile.location) {
    lines.push(`ADR;TYPE=WORK:;;${esc(profile.location)};;;;`);
  }
  if (photo) {
    // Embedded so the portrait shows in the saved contact offline; this is the
    // reliable path since many contact apps do not fetch remote photo URLs.
    lines.push(foldLine(`PHOTO;ENCODING=b;TYPE=${photo.type}:${photo.base64}`));
  } else if (options?.photoUrl) {
    // A URL reference is tiny enough for a QR payload. Apps that honour it get
    // the picture; apps that ignore remote photos simply skip this line.
    lines.push(foldLine(`PHOTO;VALUE=URI:${options.photoUrl}`));
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

/** Longest edge, in pixels, for an embedded contact photo. */
const PHOTO_MAX_EDGE = 480;

/** Read a blob as a base64 data URL. */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Pull the base64 payload and image type token out of a data URL. */
function parseDataUrl(dataUrl: string): VCardPhoto | undefined {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    return undefined;
  }
  const type = match[1]
    .slice("image/".length)
    .toUpperCase()
    .replace("JPG", "JPEG");
  return { base64: match[2], type };
}

/**
 * Downscale an image blob to a contact-sized JPEG so the embedded photo stays
 * small. Returns undefined if the browser cannot decode or draw the image, so
 * the caller can fall back to the original bytes.
 */
async function downscalePhoto(blob: Blob): Promise<VCardPhoto | undefined> {
  if (typeof createImageBitmap !== "function") {
    return undefined;
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    return undefined;
  }
  try {
    const scale = Math.min(
      1,
      PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return undefined;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    const parsed = parseDataUrl(canvas.toDataURL("image/jpeg", 0.82));
    return parsed ? { ...parsed, type: "JPEG" } : undefined;
  } finally {
    bitmap.close();
  }
}

/**
 * Fetch a portrait and encode it as base64 for embedding in a vCard. The image
 * is downscaled to a contact-sized JPEG to keep the .vcf small. Returns
 * undefined if the image cannot be fetched (for example, blocked by CORS) so
 * the caller can still produce a photo-less vCard.
 */
export async function fetchVCardPhoto(
  url: string,
): Promise<VCardPhoto | undefined> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) {
      return undefined;
    }
    const blob = await res.blob();
    const downscaled = await downscalePhoto(blob);
    if (downscaled) {
      return downscaled;
    }
    // Fall back to the original bytes when downscaling is unavailable.
    return parseDataUrl(await blobToDataUrl(blob));
  } catch {
    return undefined;
  }
}

/** Create a text/vcard blob and trigger a .vcf download named from the slug. */
export function downloadVCard(profile: VCardProfile, photo?: VCardPhoto): void {
  const vcard = buildVCard(profile, photo);
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${profile.slug || "contact"}.vcf`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
