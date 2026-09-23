import { create } from "zustand";

/**
 * Global Zustand store managing desktop sidebar collapse and mobile drawer visibility.
 */
export const useSidebarStore = create((set) => ({
  isOpen: false,
  isMobileOpen: false,
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleMobileOpen: () =>
    set((state) => ({ isMobileOpen: !state.isMobileOpen })),
  setMobileOpen: (isMobileOpen) => set({ isMobileOpen }),
  closeAll: () => set({ isOpen: false, isMobileOpen: false }),
}));
