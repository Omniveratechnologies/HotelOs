/**
 * URL and Domain Security Utility for HotelOS Kiosk.
 *
 * Enforces strict same-site boundaries and URL comparison so the kiosk cannot
 * be navigated or redirected outside the server-assigned website.
 */

interface HostInfo {
  hostname: string;
  baseDomain: string;
}

/**
 * Extracts normalized hostname and base domain (eTLD+1).
 * E.g. "www.anixlab.in" -> { hostname: "www.anixlab.in", baseDomain: "anixlab.in" }
 * E.g. "192.168.1.50" -> { hostname: "192.168.1.50", baseDomain: "192.168.1.50" }
 */
export function getHostInfo(rawUrl: string): HostInfo | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    const hostname = parsed.hostname.toLowerCase();

    // Check if hostname is an IPv4/IPv6 address or localhost
    const isIp =
      /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) ||
      hostname === "localhost" ||
      hostname.includes(":");

    if (isIp) {
      return { hostname, baseDomain: hostname };
    }

    const parts = hostname.split(".");
    if (parts.length <= 2) {
      return { hostname, baseDomain: hostname };
    }

    // Handle common two-part public suffix country-code TLDs (.co.in, .org.in, .co.uk, .com.au, etc.)
    const secondLast = parts[parts.length - 2];
    const last = parts[parts.length - 1];
    const isTwoPartTld =
      (secondLast === "co" ||
        secondLast === "com" ||
        secondLast === "org" ||
        secondLast === "ac" ||
        secondLast === "gov" ||
        secondLast === "net" ||
        secondLast === "edu") &&
      last.length === 2;

    const baseDomain =
      isTwoPartTld && parts.length >= 3
        ? parts.slice(-3).join(".")
        : parts.slice(-2).join(".");

    return { hostname, baseDomain };
  } catch {
    return null;
  }
}

/**
 * Strictly verifies whether a target URL belongs to the same site (same base domain or IP)
 * as the server-assigned base URL.
 *
 * Example (Base: "https://www.anixlab.in"):
 * - "https://www.anixlab.in/about" -> TRUE
 * - "https://anixlab.in" -> TRUE
 * - "https://portal.anixlab.in" -> TRUE
 * - "https://facebook.com" -> FALSE
 * - "https://google.com" -> FALSE
 * - "intent://..." -> FALSE
 */
export function isSameSiteUrl(
  targetUrl: string | undefined | null,
  baseServerUrl: string | undefined | null,
): boolean {
  if (!targetUrl || !baseServerUrl) return false;

  // Allow internal webview pages
  if (targetUrl.startsWith("about:")) return true;

  // Reject non-web protocols immediately
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    return false;
  }

  const baseInfo = getHostInfo(baseServerUrl);
  const targetInfo = getHostInfo(targetUrl);

  if (!baseInfo || !targetInfo) return false;

  // If base is an IP address or localhost, target must match the exact IP/hostname
  if (baseInfo.hostname === baseInfo.baseDomain) {
    return targetInfo.hostname === baseInfo.hostname;
  }

  // Target must either match exact hostname or belong to the same base domain
  return (
    targetInfo.hostname === baseInfo.hostname ||
    targetInfo.hostname === baseInfo.baseDomain ||
    targetInfo.hostname.endsWith("." + baseInfo.baseDomain)
  );
}

/**
 * Normalizes a URL for equality comparison (strips trailing slashes, fragments, and empty search).
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    const pathname = u.pathname.replace(/\/+$/, "") || "/";
    return `${u.protocol}//${u.host}${pathname}${u.search}`;
  } catch {
    return rawUrl.trim().replace(/\/+$/, "");
  }
}

/**
 * Checks if the current WebView URL is the initial server-assigned URL.
 * When true, pressing the device Back button should stop and stay on the page.
 */
export function isSameOrInitialUrl(
  currentUrl: string | undefined | null,
  initialUrl: string | undefined | null,
): boolean {
  if (!currentUrl || !initialUrl) return false;
  return normalizeUrl(currentUrl) === normalizeUrl(initialUrl);
}
