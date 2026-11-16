let wakeLockSentinel: any = null;

export const webWindow = {
  async keepAwake(enable: boolean): Promise<boolean> {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return false;
    }

    try {
      if (enable) {
        if (!wakeLockSentinel) {
          wakeLockSentinel = await (navigator as any).wakeLock.request(
            "screen",
          );
          wakeLockSentinel.addEventListener("release", () => {
            wakeLockSentinel = null;
          });
        }
        return true;
      } else {
        if (wakeLockSentinel) {
          await wakeLockSentinel.release();
          wakeLockSentinel = null;
        }
        return true;
      }
    } catch (err) {
      console.warn("[WebWindow] WakeLock error:", err);
      return false;
    }
  },

  async setFullScreen(enable: boolean): Promise<boolean> {
    if (typeof document === "undefined") return false;

    try {
      if (enable) {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      }
      return true;
    } catch (err) {
      console.warn("[WebWindow] Fullscreen error:", err);
      return false;
    }
  },
};
