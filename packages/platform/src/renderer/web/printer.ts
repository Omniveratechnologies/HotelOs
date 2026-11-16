import type { PrinterInfo, PrintOptions } from "../../types/index.ts";

export const webPrinter = {
  async getPrinters(): Promise<PrinterInfo[]> {
    return [
      {
        name: "Default System Printer",
        displayName: "System Printer (Browser Dialog)",
        isDefault: true,
      },
    ];
  },

  async print(
    _options?: PrintOptions,
  ): Promise<{ success: boolean; failureReason?: string }> {
    try {
      if (typeof window !== "undefined") {
        window.print();
        return { success: true };
      }
      return { success: false, failureReason: "Window context not available" };
    } catch (err) {
      return {
        success: false,
        failureReason: err instanceof Error ? err.message : String(err),
      };
    }
  },

  async printRaw(
    _printerName: string,
    _data: string | Uint8Array,
  ): Promise<boolean> {
    console.warn(
      "[WebPrinter] Raw ESC/POS printing is not directly supported in browser web mode.",
    );
    return false;
  },
};
