import { isDesktop, isWeb, platformType } from "./detector/index.ts";
import { desktopPlatform } from "./renderer/desktop/index.ts";
import { webPlatform } from "./renderer/web/index.ts";
import type { PlatformAPI } from "./types/index.ts";

export * from "./types/index.ts";
export { isDesktop, isWeb, platformType };

export const platform: PlatformAPI = isDesktop ? desktopPlatform : webPlatform;
export const platformAPI: PlatformAPI = platform;

export default platform;
