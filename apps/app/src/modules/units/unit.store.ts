import { create } from "zustand";

type UnitStore = {
  selectedUnits: string[];
  isUnitModalOpen: boolean;
  setSelectedUnits: (ids: string[]) => void;
  toggleUnitSelection: (id: string) => void;
  clearSelectedUnits: () => void;
  setUnitModalOpen: (isOpen: boolean) => void;
  hasSelectedUnits: () => boolean;
  selectedCount: () => number;
};

export const useUnitStore = create<UnitStore>((set, get) => ({
  selectedUnits: [],
  isUnitModalOpen: false,

  setSelectedUnits: (ids: string[]) => {
    set({ selectedUnits: ids });
  },

  toggleUnitSelection: (id: string) => {
    set((state) => {
      const isSelected = state.selectedUnits.includes(id);
      const newSelected = isSelected
        ? state.selectedUnits.filter((i) => i !== id)
        : [...state.selectedUnits, id];
      return { selectedUnits: newSelected };
    });
  },

  clearSelectedUnits: () => {
    set({ selectedUnits: [] });
  },

  setUnitModalOpen: (isOpen: boolean) => {
    set({ isUnitModalOpen: isOpen });
  },

  hasSelectedUnits: () => get().selectedUnits.length > 0,

  selectedCount: () => get().selectedUnits.length,
}));
