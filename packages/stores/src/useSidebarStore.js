import { create } from "zustand";

/**
 * Simplified sidebar store - single state for both mobile drawer and desktop collapse.
 * Desktop collapse is NOT persisted (simpler).
 */
export const useSidebarStore = create((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
}));
