import { create } from "zustand";
import type { ReferenceStatus, ReferenceType } from "./reference.type";

type ReferenceStore = {
  selectedReferences: string[];
  isReferenceModalOpen: boolean;
  isVerifyModalOpen: boolean;
  filterStatus: ReferenceStatus | null;
  filterType: ReferenceType | null;
  activeReferenceId: string | null;

  // Selection methods
  setSelectedReferences: (ids: string[]) => void;
  toggleReferenceSelection: (id: string) => void;
  clearSelectedReferences: () => void;
  hasSelectedReferences: () => boolean;
  selectedCount: () => number;

  // Modal methods
  setReferenceModalOpen: (isOpen: boolean) => void;
  setVerifyModalOpen: (isOpen: boolean) => void;

  // Active reference methods
  setActiveReference: (id: string | null) => void;
  clearActiveReference: () => void;

  // Filter methods
  setFilterStatus: (status: ReferenceStatus | null) => void;
  setFilterType: (type: ReferenceType | null) => void;
  clearFilters: () => void;
};

export const useReferenceStore = create<ReferenceStore>((set, get) => ({
  selectedReferences: [],
  isReferenceModalOpen: false,
  isVerifyModalOpen: false,
  filterStatus: null,
  filterType: null,
  activeReferenceId: null,

  // Selection methods
  setSelectedReferences: (ids: string[]) => {
    set({ selectedReferences: ids });
  },

  toggleReferenceSelection: (id: string) => {
    set((state) => {
      const isSelected = state.selectedReferences.includes(id);
      const newSelected = isSelected
        ? state.selectedReferences.filter((i) => i !== id)
        : [...state.selectedReferences, id];
      return { selectedReferences: newSelected };
    });
  },

  clearSelectedReferences: () => {
    set({ selectedReferences: [] });
  },

  hasSelectedReferences: () => get().selectedReferences.length > 0,

  selectedCount: () => get().selectedReferences.length,

  // Modal methods
  setReferenceModalOpen: (isOpen: boolean) => {
    set({ isReferenceModalOpen: isOpen });
  },

  setVerifyModalOpen: (isOpen: boolean) => {
    set({ isVerifyModalOpen: isOpen });
  },

  // Active reference methods
  setActiveReference: (id: string | null) => {
    set({ activeReferenceId: id });
  },

  clearActiveReference: () => {
    set({ activeReferenceId: null });
  },

  // Filter methods
  setFilterStatus: (status: ReferenceStatus | null) => {
    set({ filterStatus: status });
  },

  setFilterType: (type: ReferenceType | null) => {
    set({ filterType: type });
  },

  clearFilters: () => {
    set({ filterStatus: null, filterType: null });
  },
}));
