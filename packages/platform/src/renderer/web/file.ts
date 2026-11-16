import type { DownloadOptions } from "../../types/index.ts";

export const webFile = {
  async downloadFile(options: DownloadOptions): Promise<boolean> {
    if (typeof document === "undefined") return false;

    let blobUrl = options.url;
    let createdBlob = false;

    if (!blobUrl && options.data !== undefined) {
      const mimeType = options.mimeType || "application/octet-stream";
      const blob =
        typeof options.data === "string"
          ? new Blob([options.data], { type: mimeType })
          : new Blob([options.data as any], { type: mimeType });
      blobUrl = URL.createObjectURL(blob);
      createdBlob = true;
    }

    if (!blobUrl) return false;

    try {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = options.filename || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } finally {
      if (createdBlob && blobUrl) {
        setTimeout(() => URL.revokeObjectURL(blobUrl!), 10000);
      }
    }
  },

  async openFile(
    filters?: { name: string; extensions: string[] }[],
  ): Promise<string | null> {
    if (typeof document === "undefined") return null;

    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      if (filters && filters.length > 0) {
        input.accept = filters
          .flatMap((f) =>
            f.extensions.map((ext) => (ext.startsWith(".") ? ext : `.${ext}`)),
          )
          .join(",");
      }

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        resolve(file.name);
      };

      input.oncancel = () => resolve(null);
      input.click();
    });
  },
};
