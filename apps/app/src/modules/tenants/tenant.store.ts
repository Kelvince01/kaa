import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { Tenant } from "./tenant.type";

type TenantStore = {
  tenant: Tenant | null;
  selectedTenants: string[];
  isTenantModalOpen: boolean;
  setSelectedTenants: (ids: string[]) => void;
  toggleTenantSelection: (id: string) => void;
  clearSelectedTenants: () => void;
  setTenantModalOpen: (isOpen: boolean) => void;
  hasSelectedTenants: () => boolean;
  selectedCount: () => number;
  setTenant: (tenant: Tenant) => void;
};

export const useTenantStore = create<TenantStore>((set, get) => ({
  tenant: null,
  selectedTenants: [],
  isTenantModalOpen: false,

  setSelectedTenants: (ids: string[]) => {
    set({ selectedTenants: ids });
  },

  toggleTenantSelection: (id: string) => {
    set((state) => {
      const isSelected = state.selectedTenants.includes(id);
      const newSelected = isSelected
        ? state.selectedTenants.filter((i) => i !== id)
        : [...state.selectedTenants, id];
      return { selectedTenants: newSelected };
    });
  },

  clearSelectedTenants: () => {
    set({ selectedTenants: [] });
  },

  setTenantModalOpen: (isOpen: boolean) => {
    set({ isTenantModalOpen: isOpen });
  },

  hasSelectedTenants: () => get().selectedTenants.length > 0,

  selectedCount: () => get().selectedTenants.length,

  setTenant: (tenant: Tenant) => {
    set({ tenant });
  },
}));

export const useTenant = () =>
  useTenantStore(useShallow((state) => state.tenant));

export const useSetTenant = () =>
  useTenantStore(useShallow((state) => state.setTenant));
