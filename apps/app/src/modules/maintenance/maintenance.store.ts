import { create } from "zustand";

type MaintenanceStore = {
  selectedMaintenances: string[];
  isMaintenanceModalOpen: boolean;
  setSelectedMaintenances: (ids: string[]) => void;
  toggleMaintenanceSelection: (id: string) => void;
  clearSelectedMaintenances: () => void;
  setMaintenanceModalOpen: (isOpen: boolean) => void;
  hasSelectedMaintenances: () => boolean;
  selectedCount: () => number;
};

export const useMaintenanceStore = create<MaintenanceStore>((set, get) => ({
  selectedMaintenances: [],
  isMaintenanceModalOpen: false,

  setSelectedMaintenances: (ids: string[]) => {
    set({ selectedMaintenances: ids });
  },

  toggleMaintenanceSelection: (id: string) => {
    set((state) => {
      const isSelected = state.selectedMaintenances.includes(id);
      const newSelected = isSelected
        ? state.selectedMaintenances.filter((i) => i !== id)
        : [...state.selectedMaintenances, id];
      return { selectedMaintenances: newSelected };
    });
  },

  clearSelectedMaintenances: () => {
    set({ selectedMaintenances: [] });
  },

  setMaintenanceModalOpen: (isOpen: boolean) => {
    set({ isMaintenanceModalOpen: isOpen });
  },

  hasSelectedMaintenances: () => get().selectedMaintenances.length > 0,

  selectedCount: () => get().selectedMaintenances.length,
}));
