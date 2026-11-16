import { powerSaveBlocker } from "electron";

let blockerId: number | null = null;

export const powerService = {
  keepAwake(enable: boolean): boolean {
    try {
      if (enable) {
        if (blockerId === null || !powerSaveBlocker.isStarted(blockerId)) {
          blockerId = powerSaveBlocker.start("prevent-display-sleep");
        }
        return true;
      } else {
        if (blockerId !== null && powerSaveBlocker.isStarted(blockerId)) {
          powerSaveBlocker.stop(blockerId);
          blockerId = null;
        }
        return true;
      }
    } catch (error) {
      console.error("[PowerService] PowerSaveBlocker error:", error);
      return false;
    }
  },
};
