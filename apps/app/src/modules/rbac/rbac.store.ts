import { create } from "zustand";

type RBACStore = {
  // Role management
  selectedRoles: string[];
  isRoleModalOpen: boolean;
  isCreateRoleModalOpen: boolean;
  isUpdateRoleModalOpen: boolean;
  editingRole: string | null;

  // Permission management
  selectedPermissions: string[];
  isPermissionModalOpen: boolean;
  isCreatePermissionModalOpen: boolean;
  isUpdatePermissionModalOpen: boolean;
  editingPermission: string | null;

  // Role assignment
  isAssignRoleModalOpen: boolean;
  selectedUser: string | null;

  // Permission assignment
  isAssignPermissionModalOpen: boolean;
  selectedRole: string | null;

  // Role actions
  setSelectedRoles: (ids: string[]) => void;
  toggleRoleSelection: (id: string) => void;
  clearSelectedRoles: () => void;
  setRoleModalOpen: (isOpen: boolean) => void;
  setCreateRoleModalOpen: (isOpen: boolean) => void;
  setUpdateRoleModalOpen: (isOpen: boolean, roleId?: string) => void;

  // Permission actions
  setSelectedPermissions: (ids: string[]) => void;
  togglePermissionSelection: (id: string) => void;
  clearSelectedPermissions: () => void;
  setPermissionModalOpen: (isOpen: boolean) => void;
  setCreatePermissionModalOpen: (isOpen: boolean) => void;
  setUpdatePermissionModalOpen: (
    isOpen: boolean,
    permissionId?: string
  ) => void;

  // Role assignment actions
  setAssignRoleModalOpen: (isOpen: boolean, userId?: string) => void;

  // Permission assignment actions
  setAssignPermissionModalOpen: (isOpen: boolean, roleId?: string) => void;

  // Utility functions
  hasSelectedRoles: () => boolean;
  hasSelectedPermissions: () => boolean;
  selectedRoleCount: () => number;
  selectedPermissionCount: () => number;
};

export const useRBACStore = create<RBACStore>((set, get) => ({
  // Initial state
  selectedRoles: [],
  isRoleModalOpen: false,
  isCreateRoleModalOpen: false,
  isUpdateRoleModalOpen: false,
  editingRole: null,

  selectedPermissions: [],
  isPermissionModalOpen: false,
  isCreatePermissionModalOpen: false,
  isUpdatePermissionModalOpen: false,
  editingPermission: null,

  isAssignRoleModalOpen: false,
  selectedUser: null,

  isAssignPermissionModalOpen: false,
  selectedRole: null,

  // Role actions
  setSelectedRoles: (ids: string[]) => {
    set({ selectedRoles: ids });
  },

  toggleRoleSelection: (id: string) => {
    set((state) => {
      const isSelected = state.selectedRoles.includes(id);
      const newSelected = isSelected
        ? state.selectedRoles.filter((i) => i !== id)
        : [...state.selectedRoles, id];
      return { selectedRoles: newSelected };
    });
  },

  clearSelectedRoles: () => {
    set({ selectedRoles: [] });
  },

  setRoleModalOpen: (isOpen: boolean) => {
    set({ isRoleModalOpen: isOpen });
  },

  setCreateRoleModalOpen: (isOpen: boolean) => {
    set({ isCreateRoleModalOpen: isOpen });
  },

  setUpdateRoleModalOpen: (isOpen: boolean, roleId?: string) => {
    set({
      isUpdateRoleModalOpen: isOpen,
      editingRole: isOpen ? roleId || null : null,
    });
  },

  // Permission actions
  setSelectedPermissions: (ids: string[]) => {
    set({ selectedPermissions: ids });
  },

  togglePermissionSelection: (id: string) => {
    set((state) => {
      const isSelected = state.selectedPermissions.includes(id);
      const newSelected = isSelected
        ? state.selectedPermissions.filter((i) => i !== id)
        : [...state.selectedPermissions, id];
      return { selectedPermissions: newSelected };
    });
  },

  clearSelectedPermissions: () => {
    set({ selectedPermissions: [] });
  },

  setPermissionModalOpen: (isOpen: boolean) => {
    set({ isPermissionModalOpen: isOpen });
  },

  setCreatePermissionModalOpen: (isOpen: boolean) => {
    set({ isCreatePermissionModalOpen: isOpen });
  },

  setUpdatePermissionModalOpen: (isOpen: boolean, permissionId?: string) => {
    set({
      isUpdatePermissionModalOpen: isOpen,
      editingPermission: isOpen ? permissionId || null : null,
    });
  },

  // Role assignment actions
  setAssignRoleModalOpen: (isOpen: boolean, userId?: string) => {
    set({
      isAssignRoleModalOpen: isOpen,
      selectedUser: isOpen ? userId || null : null,
    });
  },

  // Permission assignment actions
  setAssignPermissionModalOpen: (isOpen: boolean, roleId?: string) => {
    set({
      isAssignPermissionModalOpen: isOpen,
      selectedRole: isOpen ? roleId || null : null,
    });
  },

  // Utility functions
  hasSelectedRoles: () => {
    return get().selectedRoles.length > 0;
  },

  hasSelectedPermissions: () => {
    return get().selectedPermissions.length > 0;
  },

  selectedRoleCount: () => {
    return get().selectedRoles.length;
  },

  selectedPermissionCount: () => {
    return get().selectedPermissions.length;
  },
}));
