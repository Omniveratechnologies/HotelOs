// Allowed document file types
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const MAX_FILES = 5;

// Validate a single document's MIME type and size against the upload rules.
// Returns an error message string, or null when valid.
export function validateDocument({ mimeType, size } = {}) {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return "Only JPG, PNG, WEBP and PDF documents are allowed";
  }

  if (!size || size > MAX_FILE_SIZE) {
    return "Each document must be 5 MB or smaller";
  }

  return null;
}
