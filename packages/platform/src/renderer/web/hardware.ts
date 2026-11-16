import type { UsbDeviceInfo } from "../../types/index.ts";

export const webHardware = {
  async listUsbDevices(): Promise<UsbDeviceInfo[]> {
    if (
      typeof navigator !== "undefined" &&
      "usb" in navigator &&
      typeof (navigator as any).usb?.getDevices === "function"
    ) {
      try {
        const devices = await (navigator as any).usb.getDevices();
        return devices.map((d: any) => ({
          vendorId: `0x${d.vendorId.toString(16).padStart(4, "0")}`,
          productId: `0x${d.productId.toString(16).padStart(4, "0")}`,
          name: d.productName || "WebUSB Device",
          manufacturer: d.manufacturerName,
          serialNumber: d.serialNumber,
        }));
      } catch (err) {
        console.warn("[WebHardware] WebUSB getDevices error:", err);
      }
    }
    return [];
  },
};
