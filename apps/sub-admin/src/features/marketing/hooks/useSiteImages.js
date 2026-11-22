/**
 * useSiteImages(pageKey, defaults)
 *
 * Returns the image URLs for a marketing page.
 *
 * For now it simply returns `defaults` (all URLs empty, so every ImageSlot
 * shows its placeholder).
 *
 * When the backend is ready (images uploaded from the admin dashboard to
 * Cloudinary, URLs saved by the backend), fetch them here and merge over
 * the defaults, for example:
 *
 *   const { data } = useQuery({
 *     queryKey: ["site-images", pageKey],
 *     queryFn: () => fetchSiteImages(pageKey),
 *   });
 *   return { ...defaults, ...(data ?? {}) };
 *
 * No page needs to change when that happens.
 * Never put the Cloudinary API key or secret in this app: it stays on the backend.
 */
export default function useSiteImages(pageKey, defaults = {}) {
  void pageKey; // used once the backend is connected
  return defaults;
}
