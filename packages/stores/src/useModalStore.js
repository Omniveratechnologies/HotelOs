import { create } from "zustand";

/**
 * Global Zustand store managing active dialog / modal visibility and props.
 */
export const useModalStore = create((set) => ({
  activeModal: null,
  modalProps: {},
  openModal: (activeModal, modalProps = {}) => set({ activeModal, modalProps }),
  closeModal: () => set({ activeModal: null, modalProps: {} }),
}));
