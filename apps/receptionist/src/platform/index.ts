import type { PlatformAPI } from "./types.ts";
import { webPlatformAPI } from "./web.ts";
import { electronPlatformAPI } from "./electron.ts";

export * from "./types.ts";

export const isDesktop: boolean =
  typeof window !== "undefined" && Boolean(window.desktop?.isDesktop);

export const platform: "web" | "electron" = isDesktop ? "electron" : "web";

export const platformAPI: PlatformAPI = isDesktop
  ? electronPlatformAPI
  : webPlatformAPI;

export default platformAPI;
