/// <reference types="vite/client" />

import type { DesktopAPI } from "@hotelos/platform/types";

declare global {
  interface Window {
    desktop?: DesktopAPI;
  }
}
