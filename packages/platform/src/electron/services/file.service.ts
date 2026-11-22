import { dialog, app, type BrowserWindow } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import type { DownloadOptions } from "../../types/index.ts";

export const fileService = {
  async downloadFile(
    window: BrowserWindow | null,
    options: DownloadOptions,
  ): Promise<boolean> {
    try {
      let targetPath: string | undefined;

      if (options.promptSaveAs && window) {
        const result = await dialog.showSaveDialog(window, {
          defaultPath: options.filename,
        });
        if (result.canceled || !result.filePath) {
          return false;
        }
        targetPath = result.filePath;
      } else {
        const downloadsDir = app.getPath("downloads");
        targetPath = path.join(downloadsDir, options.filename);
      }

      if (options.data !== undefined) {
        const buffer =
          typeof options.data === "string"
            ? Buffer.from(options.data, "utf8")
            : Buffer.from(options.data);
        await fs.writeFile(targetPath, buffer);
        return true;
      }

      if (options.url) {
        const response = await fetch(options.url);
        const arrayBuffer = await response.arrayBuffer();
        await fs.writeFile(targetPath, Buffer.from(arrayBuffer));
        return true;
      }

      return false;
    } catch (error) {
      console.error("[FileService] Failed to save file:", error);
      return false;
    }
  },

  async openFile(
    window: BrowserWindow | null,
    filters?: { name: string; extensions: string[] }[],
  ): Promise<string | null> {
    if (!window) return null;
    const result = await dialog.showOpenDialog(window, {
      properties: ["openFile"],
      filters,
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  },
};
