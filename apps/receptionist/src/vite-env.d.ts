/// <reference types="vite/client" />

import type { PlatformAPI } from "./platform/types.ts";

declare global {
  interface Window {
    desktop?: PlatformAPI;
  }
}
