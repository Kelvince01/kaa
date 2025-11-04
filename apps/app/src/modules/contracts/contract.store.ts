import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  Contract,
  ContractQueryParams,
  ContractStatus,
  ContractType,
} from "./contract.type";

/**
 * Contract modal states
 */
type ContractModals = {
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isSignModalOpen: boolean;
  isTerminateModalOpen: boolean;
  isRenewModalOpen: boolean;
  isDocumentModalOpen: boolean;
  isAmendmentModalOpen: boolean;
  isViewModalOpen: boolean;
};

/**
 * Contract form states
 */
type ContractFormState = {
  currentContract: Partial<Contract> | null;
  isSubmitting: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
};

/**
 * Contract filters and search state
 */
type ContractFiltersState = {
  searchTerm?: string;
  statusFilter: ContractStatus[];
  typeFilter: ContractType[];
  propertyFilter: string[];
  tenantFilter: string[];
  dateRange: {
    startDate?: Date;
    endDate?: Date;
    field: "startDate" | "endDate" | "createdAt" | "updatedAt";
  } | null;
  rentRange: {
    min?: number;
    max?: number;
  } | null;
  sortBy:
    | "createdAt"
    | "updatedAt"
    | "startDate"
    | "endDate"
    | "rentAmount"
    | "status";
  sortOrder: "asc" | "desc";
  showArchived: boolean;
  tagsFilter: string[];
};

/**
 * Contract view preferences
 */
type ContractViewPreferences = {
  viewMode: "table" | "grid" | "list";
  itemsPerPage: number;
  selectedColumns: string[];
  compactView: boolean;
};

/**
 * Main contract store interface
 */
type ContractStore = {
  // Selection state
  selectedContracts: string[];
  lastSelectedContract: string | null;

  // Modal states
  modals: ContractModals;

  // Form state
  form: ContractFormState;

  // Filters and search
  filters: ContractFiltersState;

  // View preferences
  viewPreferences: ContractViewPreferences;

  // UI state
  isLoading: boolean;
  bulkActionLoading: boolean;
  lastRefresh: Date | null;

  // Selection actions
  setSelectedContracts: (ids: string[]) => void;
  toggleContractSelection: (id: string) => void;
  selectAllContracts: (contractIds: string[]) => void;
  clearSelectedContracts: () => void;
  isContractSelected: (id: string) => boolean;
  hasSelectedContracts: () => boolean;
  selectedCount: () => number;
  setLastSelectedContract: (id: string | null) => void;

  // Modal actions
  openModal: (modal: keyof ContractModals, contractId?: string) => void;
  closeModal: (modal: keyof ContractModals) => void;
  closeAllModals: () => void;

  // Form actions
  setCurrentContract: (contract: Partial<Contract> | null) => void;
  setFormSubmitting: (isSubmitting: boolean) => void;
  setFormErrors: (errors: Record<string, string>) => void;
  setFormDirty: (isDirty: boolean) => void;
  resetForm: () => void;
  updateFormField: (field: string, value: any) => void;

  // Filter actions
  setSearchTerm: (term: string) => void;
  setStatusFilter: (statuses: ContractStatus[]) => void;
  setTypeFilter: (types: ContractType[]) => void;
  setPropertyFilter: (propertyIds: string[]) => void;
  setTenantFilter: (tenantIds: string[]) => void;
  setDateRange: (range: ContractFiltersState["dateRange"]) => void;
  setRentRange: (range: ContractFiltersState["rentRange"]) => void;
  setSortBy: (sortBy: ContractFiltersState["sortBy"]) => void;
  setSortOrder: (order: "asc" | "desc") => void;
  setShowArchived: (show: boolean) => void;
  setTagsFilter: (tags: string[]) => void;
  clearFilters: () => void;
  getActiveFiltersCount: () => number;
  getQueryParams: () => ContractQueryParams;

  // View preference actions
  setViewMode: (mode: ContractViewPreferences["viewMode"]) => void;
  setItemsPerPage: (count: number) => void;
  setSelectedColumns: (columns: string[]) => void;
  setCompactView: (compact: boolean) => void;

  // UI state actions
  setLoading: (loading: boolean) => void;
  setBulkActionLoading: (loading: boolean) => void;
  setLastRefresh: (date: Date) => void;

  // Utility actions
  resetStore: () => void;
  bulkUpdateContracts: (
    contractIds: string[],
    updates: Partial<Contract>
  ) => void;
  addContractToSelection: (contractId: string) => void;
  removeContractFromSelection: (contractId: string) => void;
};

// Default states
const defaultModals: ContractModals = {
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  isSignModalOpen: false,
  isTerminateModalOpen: false,
  isRenewModalOpen: false,
  isDocumentModalOpen: false,
  isAmendmentModalOpen: false,
  isViewModalOpen: false,
};

const defaultForm: ContractFormState = {
  currentContract: null,
  isSubmitting: false,
  errors: {},
  isDirty: false,
};

const defaultFilters: ContractFiltersState = {
  searchTerm: "",
  statusFilter: [],
  typeFilter: [],
  propertyFilter: [],
  tenantFilter: [],
  dateRange: null,
  rentRange: null,
  sortBy: "createdAt",
  sortOrder: "desc",
  showArchived: false,
  tagsFilter: [],
};

const defaultViewPreferences: ContractViewPreferences = {
  viewMode: "table",
  itemsPerPage: 25,
  selectedColumns: [
    "title",
    "property",
    "tenants",
    "status",
    "startDate",
    "endDate",
    "rentAmount",
    "actions",
  ],
  compactView: false,
};

/**
 * Create the contract store with persistence for preferences
 */
export const useContractStore = create<ContractStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        selectedContracts: [],
        lastSelectedContract: null,
        modals: defaultModals,
        form: defaultForm,
        filters: defaultFilters,
        viewPreferences: defaultViewPreferences,
        isLoading: false,
        bulkActionLoading: false,
        lastRefresh: null,

        // Selection actions
        setSelectedContracts: (ids: string[]) => {
          set({ selectedContracts: ids });
        },

        toggleContractSelection: (id: string) => {
          set((state) => {
            const isSelected = state.selectedContracts.includes(id);
            const newSelected = isSelected
              ? state.selectedContracts.filter(
                  (contractId) => contractId !== id
                )
              : [...state.selectedContracts, id];

            return {
              selectedContracts: newSelected,
              lastSelectedContract: id,
            };
          });
        },

        selectAllContracts: (contractIds: string[]) => {
          set({ selectedContracts: contractIds });
        },

        clearSelectedContracts: () => {
          set({ selectedContracts: [], lastSelectedContract: null });
        },

        isContractSelected: (id: string) =>
          get().selectedContracts.includes(id),

        hasSelectedContracts: () => get().selectedContracts.length > 0,

        selectedCount: () => get().selectedContracts.length,

        setLastSelectedContract: (id: string | null) => {
          set({ lastSelectedContract: id });
        },

        // Modal actions
        openModal: (modal: keyof ContractModals, contractId?: string) => {
          set((state) => ({
            modals: {
              ...state.modals,
              [modal]: true,
            },
            ...(contractId && {
              lastSelectedContract: contractId,
            }),
          }));
        },

        closeModal: (modal: keyof ContractModals) => {
          set((state) => ({
            modals: {
              ...state.modals,
              [modal]: false,
            },
          }));
        },

        closeAllModals: () => {
          set({ modals: defaultModals });
        },

        // Form actions
        setCurrentContract: (contract: Partial<Contract> | null) => {
          set((state) => ({
            form: {
              ...state.form,
              currentContract: contract,
              errors: {},
              isDirty: false,
            },
          }));
        },

        setFormSubmitting: (isSubmitting: boolean) => {
          set((state) => ({
            form: {
              ...state.form,
              isSubmitting,
            },
          }));
        },

        setFormErrors: (errors: Record<string, string>) => {
          set((state) => ({
            form: {
              ...state.form,
              errors,
            },
          }));
        },

        setFormDirty: (isDirty: boolean) => {
          set((state) => ({
            form: {
              ...state.form,
              isDirty,
            },
          }));
        },

        resetForm: () => {
          set((_state) => ({
            form: defaultForm,
          }));
        },

        updateFormField: (field: string, value: any) => {
          set((state) => ({
            form: {
              ...state.form,
              currentContract: {
                ...state.form.currentContract,
                [field]: value,
              },
              isDirty: true,
            },
          }));
        },

        // Filter actions
        setSearchTerm: (term: string) => {
          set((state) => ({
            filters: {
              ...state.filters,
              searchTerm: term,
            },
          }));
        },

        setStatusFilter: (statuses: ContractStatus[]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              statusFilter: statuses,
            },
          }));
        },

        setTypeFilter: (types: ContractType[]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              typeFilter: types,
            },
          }));
        },

        setPropertyFilter: (propertyIds: string[]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              propertyFilter: propertyIds,
            },
          }));
        },

        setTenantFilter: (tenantIds: string[]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              tenantFilter: tenantIds,
            },
          }));
        },

        setDateRange: (range: ContractFiltersState["dateRange"]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              dateRange: range,
            },
          }));
        },

        setRentRange: (range: ContractFiltersState["rentRange"]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              rentRange: range,
            },
          }));
        },

        setSortBy: (sortBy: ContractFiltersState["sortBy"]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              sortBy,
            },
          }));
        },

        setSortOrder: (order: "asc" | "desc") => {
          set((state) => ({
            filters: {
              ...state.filters,
              sortOrder: order,
            },
          }));
        },

        setShowArchived: (show: boolean) => {
          set((state) => ({
            filters: {
              ...state.filters,
              showArchived: show,
            },
          }));
        },

        setTagsFilter: (tags: string[]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              tagsFilter: tags,
            },
          }));
        },

        clearFilters: () => {
          set((_state) => ({
            filters: defaultFilters,
          }));
        },

        getActiveFiltersCount: () => {
          const filters = get().filters;
          let count = 0;

          if (filters.searchTerm?.trim()) count++;
          if (filters.statusFilter?.length > 0) count++;
          if (filters.typeFilter?.length > 0) count++;
          if (filters.propertyFilter?.length > 0) count++;
          if (filters.tenantFilter?.length > 0) count++;
          if (filters.dateRange) count++;
          if (filters.rentRange?.min || filters.rentRange?.max) count++;
          if (filters.tagsFilter?.length > 0) count++;
          if (filters.showArchived) count++;

          return count;
        },

        getQueryParams: (): ContractQueryParams => {
          const filters = get().filters;

          return {
            ...(filters.searchTerm && { search: filters.searchTerm }),
            ...(filters.statusFilter.length > 0 && {
              status:
                filters.statusFilter.length === 1
                  ? filters.statusFilter[0]
                  : undefined,
            }),
            ...(filters.propertyFilter.length > 0 && {
              property: filters.propertyFilter[0],
            }),
            ...(filters.tenantFilter.length > 0 && {
              tenants: filters.tenantFilter,
            }),
            ...(filters.dateRange?.startDate && {
              [`${filters.dateRange.field}From`]: filters.dateRange.startDate
                .toISOString()
                .split("T")[0],
            }),
            ...(filters.dateRange?.endDate && {
              [`${filters.dateRange.field}To`]: filters.dateRange.endDate
                .toISOString()
                .split("T")[0],
            }),
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            ...(filters.tagsFilter.length > 0 && { tags: filters.tagsFilter }),
            ...(filters.showArchived && { archived: filters.showArchived }),
            limit: get().viewPreferences.itemsPerPage,
          };
        },

        // View preference actions
        setViewMode: (mode: ContractViewPreferences["viewMode"]) => {
          set((state) => ({
            viewPreferences: {
              ...state.viewPreferences,
              viewMode: mode,
            },
          }));
        },

        setItemsPerPage: (count: number) => {
          set((state) => ({
            viewPreferences: {
              ...state.viewPreferences,
              itemsPerPage: count,
            },
          }));
        },

        setSelectedColumns: (columns: string[]) => {
          set((state) => ({
            viewPreferences: {
              ...state.viewPreferences,
              selectedColumns: columns,
            },
          }));
        },

        setCompactView: (compact: boolean) => {
          set((state) => ({
            viewPreferences: {
              ...state.viewPreferences,
              compactView: compact,
            },
          }));
        },

        // UI state actions
        setLoading: (loading: boolean) => {
          set({ isLoading: loading });
        },

        setBulkActionLoading: (loading: boolean) => {
          set({ bulkActionLoading: loading });
        },

        setLastRefresh: (date: Date) => {
          set({ lastRefresh: date });
        },

        // Utility actions
        resetStore: () => {
          set({
            selectedContracts: [],
            lastSelectedContract: null,
            modals: defaultModals,
            form: defaultForm,
            filters: defaultFilters,
            isLoading: false,
            bulkActionLoading: false,
            lastRefresh: null,
            // Don't reset view preferences as they should persist
          });
        },

        bulkUpdateContracts: (
          _contractIds: string[],
          _updates: Partial<Contract>
        ) => {
          // This would typically trigger API calls to update multiple contracts
          // For now, we'll just clear the selection after bulk operations
          set({
            selectedContracts: [],
            bulkActionLoading: false,
          });
        },

        addContractToSelection: (contractId: string) => {
          set((state) => ({
            selectedContracts: state.selectedContracts.includes(contractId)
              ? state.selectedContracts
              : [...state.selectedContracts, contractId],
          }));
        },

        removeContractFromSelection: (contractId: string) => {
          set((state) => ({
            selectedContracts: state.selectedContracts.filter(
              (id) => id !== contractId
            ),
          }));
        },
      }),
      {
        name: "contract-store",
        // Only persist certain parts of the store
        partialize: (state) => ({
          viewPreferences: state.viewPreferences,
          filters: {
            sortBy: state.filters.sortBy,
            sortOrder: state.filters.sortOrder,
            showArchived: state.filters.showArchived,
          },
        }),
      }
    ),
    {
      name: "contract-store",
    }
  )
);

/**
 * Selector hooks for better performance
 */

// Modal selectors
export const useContractModals = () =>
  useContractStore((state) => state.modals);
export const useContractModal = (modal: keyof ContractModals) =>
  useContractStore((state) => state.modals[modal]);

// Selection selectors
export const useSelectedContracts = () =>
  useContractStore((state) => state.selectedContracts);
export const useHasSelectedContracts = () =>
  useContractStore((state) => state.hasSelectedContracts());
export const useSelectedContractsCount = () =>
  useContractStore((state) => state.selectedCount());

// Form selectors
export const useContractForm = () => useContractStore((state) => state.form);
export const useCurrentContract = () =>
  useContractStore((state) => state.form.currentContract);

// Filter selectors
export const useContractFilters = () =>
  useContractStore((state) => state.filters);
export const useContractQueryParams = () =>
  useContractStore((state) => state.getQueryParams());
export const useActiveFiltersCount = () =>
  useContractStore((state) => state.getActiveFiltersCount());

// View preference selectors
export const useContractViewPreferences = () =>
  useContractStore((state) => state.viewPreferences);
export const useContractViewMode = () =>
  useContractStore((state) => state.viewPreferences.viewMode);

// UI state selectors
export const useContractLoading = () =>
  useContractStore((state) => state.isLoading);
export const useBulkActionLoading = () =>
  useContractStore((state) => state.bulkActionLoading);
