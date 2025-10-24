import { create } from "zustand";
import type { Application } from "./application.type";

type ApplicationStore = {
  selectedApplicationId: string | null;
  selectedApplication: Application | null;
  selectedApplications: string[];
  isApplicationModalOpen: boolean;
  setSelectedApplications: (ids: string[]) => void;
  setSelectedApplicationId: (id: string | null) => void;
  setSelectedApplication: (application: Application | null) => void;
  toggleApplicationSelection: (id: string) => void;
  clearSelectedApplications: () => void;
  setApplicationModalOpen: (isOpen: boolean) => void;
  hasSelectedApplications: () => boolean;
  selectedCount: () => number;
};

export const useApplicationStore = create<ApplicationStore>((set, get) => ({
  selectedApplicationId: null,
  selectedApplication: null,
  selectedApplications: [],
  isApplicationModalOpen: false,

  setSelectedApplicationId: (id: string | null) => {
    set({ selectedApplicationId: id });
  },

  setSelectedApplication: (application: Application | null) => {
    set({ selectedApplication: application });
  },

  setSelectedApplications: (ids: string[]) => {
    set({ selectedApplications: ids });
  },

  toggleApplicationSelection: (id: string) => {
    set((state) => {
      const isSelected = state.selectedApplications.includes(id);
      const newSelected = isSelected
        ? state.selectedApplications.filter((i) => i !== id)
        : [...state.selectedApplications, id];
      return { selectedApplications: newSelected };
    });
  },

  clearSelectedApplications: () => {
    set({ selectedApplications: [] });
  },

  setApplicationModalOpen: (isOpen: boolean) => {
    set({ isApplicationModalOpen: isOpen });
  },

  hasSelectedApplications: () => get().selectedApplications.length > 0,

  selectedCount: () => get().selectedApplications.length,
}));
