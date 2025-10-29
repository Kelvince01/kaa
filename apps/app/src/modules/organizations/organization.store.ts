import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { Organization } from "./organization.type";

type OrganizationStore = {
  organization: Organization | null;
  selectedOrganizations: string[];
  isOrganizationModalOpen: boolean;
  setSelectedOrganizations: (ids: string[]) => void;
  toggleOrganizationSelection: (id: string) => void;
  clearSelectedOrganizations: () => void;
  setOrganizationModalOpen: (isOpen: boolean) => void;
  hasSelectedOrganizations: () => boolean;
  selectedCount: () => number;
  setOrganization: (organization: Organization) => void;
};

export const useOrganizationStore = create<OrganizationStore>((set, get) => ({
  organization: null,
  selectedOrganizations: [],
  isOrganizationModalOpen: false,

  setSelectedOrganizations: (ids: string[]) => {
    set({ selectedOrganizations: ids });
  },

  toggleOrganizationSelection: (id: string) => {
    set((state) => {
      const isSelected = state.selectedOrganizations.includes(id);
      const newSelected = isSelected
        ? state.selectedOrganizations.filter((i) => i !== id)
        : [...state.selectedOrganizations, id];
      return { selectedOrganizations: newSelected };
    });
  },

  clearSelectedOrganizations: () => {
    set({ selectedOrganizations: [] });
  },

  setOrganizationModalOpen: (isOpen: boolean) => {
    set({ isOrganizationModalOpen: isOpen });
  },

  hasSelectedOrganizations: () => get().selectedOrganizations.length > 0,

  selectedCount: () => get().selectedOrganizations.length,

  setOrganization: (organization: Organization) => {
    set({ organization });
  },
}));

export const useOrganization_Store = () =>
  useOrganizationStore(useShallow((state) => state.organization));

export const useSetOrganization_Store = () =>
  useOrganizationStore(useShallow((state) => state.setOrganization));
