import crypto from "crypto";

/** Creates a new guest check-in token; only its sha256 hash is stored. */
export function createSessionToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

/** Hashes an incoming guest token for lookup. */
export function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(String(token || ""))
    .digest("hex");
}
