import type { UsbDeviceInfo } from "../../types/index.ts";
import { webHardware } from "../web/hardware.ts";

export const desktopHardware = {
  async listUsbDevices(): Promise<UsbDeviceInfo[]> {
    if (
      typeof window !== "undefined" &&
      window.desktop?.hardware?.listUsbDevices
    ) {
      return window.desktop.hardware.listUsbDevices();
    }
    return webHardware.listUsbDevices();
  },
};
