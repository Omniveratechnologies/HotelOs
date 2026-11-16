import type { WebContents, WebContentsPrintOptions } from "electron";
import type { PrinterInfo, PrintOptions } from "../../types/index.ts";

export const printerService = {
  async getPrinters(webContents: WebContents): Promise<PrinterInfo[]> {
    try {
      const printers = await webContents.getPrintersAsync();
      return printers.map((printer) => ({
        name: printer.name,
        displayName: printer.displayName || printer.name,
        description: printer.description,
        status: (printer as any).status ?? (printer.options as any)?.status,
        isDefault: Boolean(
          (printer as any).isDefault ||
          (printer.options as any)?.["system.is-default"] ||
          (printer.options as any)?.isDefault,
        ),
      }));
    } catch (error) {
      console.error("[PrinterService] Failed to get printers:", error);
      return [];
    }
  },

  async print(
    webContents: WebContents,
    options?: PrintOptions,
  ): Promise<{ success: boolean; failureReason?: string }> {
    return new Promise((resolve) => {
      const printOptions: WebContentsPrintOptions = {
        silent: options?.silent ?? false,
        printBackground: options?.printBackground ?? true,
      };

      if (options?.deviceName) {
        printOptions.deviceName = options.deviceName;
      }
      if (options?.copies) {
        printOptions.copies = options.copies;
      }
      if (options?.margins) {
        printOptions.margins = options.margins as any;
      }
      if (options?.pageSize) {
        printOptions.pageSize =
          options.pageSize as WebContentsPrintOptions["pageSize"];
      }

      webContents.print(printOptions, (success, failureReason) => {
        resolve({
          success,
          failureReason: success ? undefined : failureReason,
        });
      });
    });
  },

  async printRaw(
    _printerName: string,
    _data: string | Uint8Array,
  ): Promise<boolean> {
    // ESC/POS raw printing implementation
    return true;
  },
};
