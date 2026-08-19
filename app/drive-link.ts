/**
 * Expense attachments are links (typically Google Drive), not uploaded files, so that
 * neither the browser's localStorage quota nor Convex file storage holds the bytes.
 *
 * A Drive *share* URL renders an HTML viewer page, not an image, so pasting one straight
 * into an `<img src>` shows a broken tile. Every Drive form is therefore reduced to its
 * file id and rebuilt as a thumbnail URL, which does serve image bytes.
 */

const DRIVE_HOSTS = ["drive.google.com", "docs.google.com", "drive.usercontent.google.com"];

/** Matches the file id in the several shapes a Drive link comes in. */
const DRIVE_ID_PATTERNS = [
  /\/file\/d\/([\w-]{10,})/, // /file/d/<id>/view
  /\/d\/([\w-]{10,})/, //      /d/<id> (googleusercontent, docs)
  /[?&]id=([\w-]{10,})/, //    ?id=<id> (open, uc, download)
];

export type ImageLinkResult = { url: string } | { error: string };

/** Width is a hint; Drive returns the largest available image up to it. */
export function driveThumbnailUrl(fileId: string, width = 1600): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
}

export function extractDriveFileId(url: URL): string | null {
  if (!DRIVE_HOSTS.includes(url.hostname)) return null;
  const target = url.pathname + url.search;
  for (const pattern of DRIVE_ID_PATTERNS) {
    const match = target.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Validates a pasted link and returns the URL to render, or a message to show the user.
 * Non-Drive https links pass through untouched so any direct image URL still works.
 */
export function normalizeImageLink(raw: string): ImageLinkResult {
  const trimmed = raw.trim();
  if (!trimmed) return { error: "Paste a link first." };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { error: "That is not a valid link. Include the https:// prefix." };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { error: "Only http and https links can be attached." };
  }

  if (DRIVE_HOSTS.includes(parsed.hostname) || parsed.hostname === "lh3.googleusercontent.com") {
    if (/\/drive\/folders\//.test(parsed.pathname)) {
      return { error: "That is a Drive folder. Open the file and copy its share link instead." };
    }
    const fileId = extractDriveFileId(parsed) ?? parsed.pathname.match(/\/d\/([\w-]{10,})/)?.[1];
    if (!fileId) return { error: "Could not find a file id in that Drive link." };
    return { url: driveThumbnailUrl(fileId) };
  }

  return { url: parsed.toString() };
}

/** Best-effort display name for a link with no user-supplied label. */
export function labelForLink(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "drive.google.com") return "Drive attachment";
    const last = parsed.pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : parsed.hostname;
  } catch {
    return "Attachment";
  }
}
