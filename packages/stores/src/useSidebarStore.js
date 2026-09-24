import { create } from "zustand";

const STORAGE_KEY = "hotelos:sidebar_open";

function getInitialState() {
  if (typeof window === "undefined") return true;
  // Mobile drawer always starts closed
  if (window.innerWidth < 1024) return false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

/**
 * Sidebar store managing both mobile drawer and desktop collapse state.
 * On desktop, isSidebarOpen: true represents an open/expanded sidebar (default).
 * On mobile, isSidebarOpen: true represents an open drawer.
 */
export const useSidebarStore = create((set) => ({
  isSidebarOpen: getInitialState(),
  toggleSidebar: () =>
    set((state) => {
      const next = !state.isSidebarOpen;
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        try {
          localStorage.setItem(STORAGE_KEY, String(next));
        } catch {
          // ignore storage error
        }
      }
      return { isSidebarOpen: next };
    }),
  openSidebar: () =>
    set(() => {
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        try {
          localStorage.setItem(STORAGE_KEY, "true");
        } catch {
          // ignore storage error
        }
      }
      return { isSidebarOpen: true };
    }),
  closeSidebar: () =>
    set(() => {
      if (typeof window !== "undefined" && window.innerWidth >= 1024) {
        try {
          localStorage.setItem(STORAGE_KEY, "false");
        } catch {
          // ignore storage error
        }
      }
      return { isSidebarOpen: false };
    }),
}));
