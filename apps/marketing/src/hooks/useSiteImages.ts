/**
 * Returns the image URLs for a marketing page.
 * Returns defaults until backend is connected.
 */
export default function useSiteImages<T extends Record<string, unknown>>(
  pageKey: string,
  defaults: T,
): T {
  void pageKey;
  return defaults;
}
