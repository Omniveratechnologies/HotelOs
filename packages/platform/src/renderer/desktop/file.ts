import type { DownloadOptions } from "../../types/index.ts";
import { webFile } from "../web/file.ts";

export const desktopFile = {
  async downloadFile(options: DownloadOptions): Promise<boolean> {
    if (typeof window !== "undefined" && window.desktop?.file?.downloadFile) {
      return window.desktop.file.downloadFile(options);
    }
    return webFile.downloadFile(options);
  },

  async openFile(
    filters?: { name: string; extensions: string[] }[],
  ): Promise<string | null> {
    if (typeof window !== "undefined" && window.desktop?.file?.openFile) {
      return window.desktop.file.openFile(filters);
    }
    return webFile.openFile(filters);
  },
};
