import type { PrinterInfo, PrintOptions } from "../../types/index.ts";
import { webPrinter } from "../web/printer.ts";

export const desktopPrinter = {
  async getPrinters(): Promise<PrinterInfo[]> {
    if (typeof window !== "undefined" && window.desktop?.printer?.getPrinters) {
      return window.desktop.printer.getPrinters();
    }
    return webPrinter.getPrinters();
  },

  async print(
    options?: PrintOptions,
  ): Promise<{ success: boolean; failureReason?: string }> {
    if (typeof window !== "undefined" && window.desktop?.printer?.print) {
      return window.desktop.printer.print(options);
    }
    return webPrinter.print(options);
  },

  async printRaw(
    printerName: string,
    data: string | Uint8Array,
  ): Promise<boolean> {
    if (typeof window !== "undefined" && window.desktop?.printer?.printRaw) {
      return window.desktop.printer.printRaw(printerName, data);
    }
    return webPrinter.printRaw(printerName, data);
  },
};
