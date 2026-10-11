import { create } from "zustand";

/**
 * Zustand store managing the front-desk receptionist chat drawer open/close state.
 */
export const useChatStore = create((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
}));
