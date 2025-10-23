import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  ConditionCategory,
  ConditionQueryParams,
  ConditionStatus,
  PropertyCondition,
  ReportType,
} from "./condition.type";

/**
 * Condition modal states
 */
type ConditionModals = {
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isViewModalOpen: boolean;
  isSignModalOpen: boolean;
  isDisputeModalOpen: boolean;
  isCompleteModalOpen: boolean;
  isArchiveModalOpen: boolean;
  isCompareModalOpen: boolean;
  isTemplateModalOpen: boolean;
  isPhotoModalOpen: boolean;
  isAttachmentModalOpen: boolean;
  isItemModalOpen: boolean;
  isExportModalOpen: boolean;
};

/**
 * Condition form states
 */
type ConditionFormState = {
  currentCondition: Partial<PropertyCondition> | null;
  isSubmitting: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
};

/**
 * Condition filters and search state
 */
type ConditionFiltersState = {
  searchTerm: string;
  statusFilter: (
    | "draft"
    | "pending_signatures"
    | "completed"
    | "disputed"
    | "archived"
  )[];
  reportTypeFilter: ReportType[];
  conditionStatusFilter: ConditionStatus[];
  categoryFilter: ConditionCategory[];
  propertyFilter: string[];
  tenantFilter: string[];
  landlordFilter: string[];
  inspectorFilter: string[];
  dateRange: {
    startDate?: Date;
    endDate?: Date;
    field: "reportDate" | "createdAt" | "completedAt";
  } | null;
  sortBy:
    | "reportDate"
    | "createdAt"
    | "updatedAt"
    | "overallCondition"
    | "status";
  sortOrder: "asc" | "desc";
  showSigned: boolean;
  showDisputed: boolean;
  showArchived: boolean;
  actionRequired?: boolean;
  signatureStatus?: "all_signed" | "pending_signatures" | "unsigned";
};

/**
 * Condition view preferences
 */
type ConditionViewPreferences = {
  viewMode: "table" | "grid" | "cards" | "timeline";
  itemsPerPage: number;
  selectedColumns: string[];
  compactView: boolean;
  showPhotos: boolean;
  groupBy: "property" | "status" | "reportType" | "date" | "none";
};

/**
 * Main condition store interface
 */
type ConditionStore = {
  // Selection state
  selectedConditions: string[];
  lastSelectedCondition: string | null;
  compareList: string[];

  // Modal states
  modals: ConditionModals;

  // Form state
  form: ConditionFormState;

  // Filters and search
  filters: ConditionFiltersState;

  // View preferences
  viewPreferences: ConditionViewPreferences;

  // UI state
  isLoading: boolean;
  bulkActionLoading: boolean;
  lastRefresh: Date | null;
  activeProperty: string | null;

  // Selection actions
  setSelectedConditions: (ids: string[]) => void;
  toggleConditionSelection: (id: string) => void;
  selectAllConditions: (conditionIds: string[]) => void;
  clearSelectedConditions: () => void;
  isConditionSelected: (id: string) => boolean;
  hasSelectedConditions: () => boolean;
  selectedCount: () => number;
  setLastSelectedCondition: (id: string | null) => void;

  // Compare actions
  addToCompare: (conditionId: string) => void;
  removeFromCompare: (conditionId: string) => void;
  clearCompareList: () => void;
  canAddToCompare: () => boolean;

  // Modal actions
  openModal: (modal: keyof ConditionModals, conditionId?: string) => void;
  closeModal: (modal: keyof ConditionModals) => void;
  closeAllModals: () => void;

  // Form actions
  setCurrentCondition: (condition: Partial<PropertyCondition> | null) => void;
  setFormSubmitting: (isSubmitting: boolean) => void;
  setFormErrors: (errors: Record<string, string>) => void;
  setFormDirty: (isDirty: boolean) => void;
  resetForm: () => void;
  updateFormField: (field: string, value: any) => void;

  // Filter actions
  setSearchTerm: (term: string) => void;
  setStatusFilter: (statuses: ConditionFiltersState["statusFilter"]) => void;
  setReportTypeFilter: (types: ReportType[]) => void;
  setConditionStatusFilter: (statuses: ConditionStatus[]) => void;
  setCategoryFilter: (categories: ConditionCategory[]) => void;
  setPropertyFilter: (propertyIds: string[]) => void;
  setTenantFilter: (tenantIds: string[]) => void;
  setLandlordFilter: (landlordIds: string[]) => void;
  setInspectorFilter: (inspectorIds: string[]) => void;
  setDateRange: (range: ConditionFiltersState["dateRange"]) => void;
  setSortBy: (sortBy: ConditionFiltersState["sortBy"]) => void;
  setSortOrder: (order: "asc" | "desc") => void;
  setShowSigned: (show: boolean) => void;
  setShowDisputed: (show: boolean) => void;
  setShowArchived: (show: boolean) => void;
  setActionRequired: (required?: boolean) => void;
  setSignatureStatus: (
    status?: "all_signed" | "pending_signatures" | "unsigned"
  ) => void;
  clearFilters: () => void;
  getActiveFiltersCount: () => number;
  getQueryParams: () => ConditionQueryParams;

  // View preference actions
  setViewMode: (mode: ConditionViewPreferences["viewMode"]) => void;
  setItemsPerPage: (count: number) => void;
  setSelectedColumns: (columns: string[]) => void;
  setCompactView: (compact: boolean) => void;
  setShowPhotos: (show: boolean) => void;
  setGroupBy: (groupBy: ConditionViewPreferences["groupBy"]) => void;

  // UI state actions
  setLoading: (loading: boolean) => void;
  setBulkActionLoading: (loading: boolean) => void;
  setLastRefresh: (date: Date) => void;
  setActiveProperty: (propertyId: string | null) => void;

  // Utility actions
  resetStore: () => void;
  bulkUpdateConditions: (
    conditionIds: string[],
    updates: Partial<PropertyCondition>
  ) => void;
  addConditionToSelection: (conditionId: string) => void;
  removeConditionFromSelection: (conditionId: string) => void;
};

// Default states
const defaultModals: ConditionModals = {
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  isViewModalOpen: false,
  isSignModalOpen: false,
  isDisputeModalOpen: false,
  isCompleteModalOpen: false,
  isArchiveModalOpen: false,
  isCompareModalOpen: false,
  isTemplateModalOpen: false,
  isPhotoModalOpen: false,
  isAttachmentModalOpen: false,
  isItemModalOpen: false,
  isExportModalOpen: false,
};

const defaultForm: ConditionFormState = {
  currentCondition: null,
  isSubmitting: false,
  errors: {},
  isDirty: false,
};

const defaultFilters: ConditionFiltersState = {
  searchTerm: "",
  statusFilter: [],
  reportTypeFilter: [],
  conditionStatusFilter: [],
  categoryFilter: [],
  propertyFilter: [],
  tenantFilter: [],
  landlordFilter: [],
  inspectorFilter: [],
  dateRange: null,
  sortBy: "reportDate",
  sortOrder: "desc",
  showSigned: true,
  showDisputed: true,
  showArchived: false,
  actionRequired: undefined,
  signatureStatus: undefined,
};

const defaultViewPreferences: ConditionViewPreferences = {
  viewMode: "table",
  itemsPerPage: 25,
  selectedColumns: [
    "property",
    "reportType",
    "reportDate",
    "overallCondition",
    "status",
    "tenant",
    "signatures",
    "actions",
  ],
  compactView: false,
  showPhotos: true,
  groupBy: "none",
};

/**
 * Create the condition store with persistence for preferences
 */
export const useConditionStore = create<ConditionStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        selectedConditions: [],
        lastSelectedCondition: null,
        compareList: [],
        modals: defaultModals,
        form: defaultForm,
        filters: defaultFilters,
        viewPreferences: defaultViewPreferences,
        isLoading: false,
        bulkActionLoading: false,
        lastRefresh: null,
        activeProperty: null,

        // Selection actions
        setSelectedConditions: (ids: string[]) => {
          set({ selectedConditions: ids });
        },

        toggleConditionSelection: (id: string) => {
          set((state) => {
            const isSelected = state.selectedConditions.includes(id);
            const newSelected = isSelected
              ? state.selectedConditions.filter(
                  (conditionId) => conditionId !== id
                )
              : [...state.selectedConditions, id];

            return {
              selectedConditions: newSelected,
              lastSelectedCondition: id,
            };
          });
        },

        selectAllConditions: (conditionIds: string[]) => {
          set({ selectedConditions: conditionIds });
        },

        clearSelectedConditions: () => {
          set({ selectedConditions: [], lastSelectedCondition: null });
        },

        isConditionSelected: (id: string) =>
          get().selectedConditions.includes(id),

        hasSelectedConditions: () => get().selectedConditions.length > 0,

        selectedCount: () => get().selectedConditions.length,

        setLastSelectedCondition: (id: string | null) => {
          set({ lastSelectedCondition: id });
        },

        // Compare actions
        addToCompare: (conditionId: string) => {
          set((state) => {
            if (state.compareList.length >= 2) return state;
            if (state.compareList.includes(conditionId)) return state;
            return { compareList: [...state.compareList, conditionId] };
          });
        },

        removeFromCompare: (conditionId: string) => {
          set((state) => ({
            compareList: state.compareList.filter((id) => id !== conditionId),
          }));
        },

        clearCompareList: () => {
          set({ compareList: [] });
        },

        canAddToCompare: () => get().compareList.length < 2,

        // Modal actions
        openModal: (modal: keyof ConditionModals, conditionId?: string) => {
          set((state) => ({
            modals: {
              ...state.modals,
              [modal]: true,
            },
            ...(conditionId && {
              lastSelectedCondition: conditionId,
            }),
          }));
        },

        closeModal: (modal: keyof ConditionModals) => {
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
        setCurrentCondition: (condition: Partial<PropertyCondition> | null) => {
          set((state) => ({
            form: {
              ...state.form,
              currentCondition: condition,
              errors: {},
              isDirty: false,
            },
          }));
        },

        setFormSubmitting: (isSubmitting: boolean) => {
          set((state) => ({
            form: { ...state.form, isSubmitting },
          }));
        },

        setFormErrors: (errors: Record<string, string>) => {
          set((state) => ({
            form: { ...state.form, errors },
          }));
        },

        setFormDirty: (isDirty: boolean) => {
          set((state) => ({
            form: { ...state.form, isDirty },
          }));
        },

        resetForm: () => {
          set({ form: defaultForm });
        },

        updateFormField: (field: string, value: any) => {
          set((state) => ({
            form: {
              ...state.form,
              currentCondition: {
                ...state.form.currentCondition,
                [field]: value,
              },
              isDirty: true,
            },
          }));
        },

        // Filter actions
        setSearchTerm: (term: string) => {
          set((state) => ({
            filters: { ...state.filters, searchTerm: term },
          }));
        },

        setStatusFilter: (statuses: ConditionFiltersState["statusFilter"]) => {
          set((state) => ({
            filters: { ...state.filters, statusFilter: statuses },
          }));
        },

        setReportTypeFilter: (types: ReportType[]) => {
          set((state) => ({
            filters: { ...state.filters, reportTypeFilter: types },
          }));
        },

        setConditionStatusFilter: (statuses: ConditionStatus[]) => {
          set((state) => ({
            filters: { ...state.filters, conditionStatusFilter: statuses },
          }));
        },

        setCategoryFilter: (categories: ConditionCategory[]) => {
          set((state) => ({
            filters: { ...state.filters, categoryFilter: categories },
          }));
        },

        setPropertyFilter: (propertyIds: string[]) => {
          set((state) => ({
            filters: { ...state.filters, propertyFilter: propertyIds },
          }));
        },

        setTenantFilter: (tenantIds: string[]) => {
          set((state) => ({
            filters: { ...state.filters, tenantFilter: tenantIds },
          }));
        },

        setLandlordFilter: (landlordIds: string[]) => {
          set((state) => ({
            filters: { ...state.filters, landlordFilter: landlordIds },
          }));
        },

        setInspectorFilter: (inspectorIds: string[]) => {
          set((state) => ({
            filters: { ...state.filters, inspectorFilter: inspectorIds },
          }));
        },

        setDateRange: (range: ConditionFiltersState["dateRange"]) => {
          set((state) => ({
            filters: { ...state.filters, dateRange: range },
          }));
        },

        setSortBy: (sortBy: ConditionFiltersState["sortBy"]) => {
          set((state) => ({
            filters: { ...state.filters, sortBy },
          }));
        },

        setSortOrder: (order: "asc" | "desc") => {
          set((state) => ({
            filters: { ...state.filters, sortOrder: order },
          }));
        },

        setShowSigned: (show: boolean) => {
          set((state) => ({
            filters: { ...state.filters, showSigned: show },
          }));
        },

        setShowDisputed: (show: boolean) => {
          set((state) => ({
            filters: { ...state.filters, showDisputed: show },
          }));
        },

        setShowArchived: (show: boolean) => {
          set((state) => ({
            filters: { ...state.filters, showArchived: show },
          }));
        },

        setActionRequired: (required?: boolean) => {
          set((state) => ({
            filters: { ...state.filters, actionRequired: required },
          }));
        },

        setSignatureStatus: (
          status?: "all_signed" | "pending_signatures" | "unsigned"
        ) => {
          set((state) => ({
            filters: { ...state.filters, signatureStatus: status },
          }));
        },

        clearFilters: () => {
          set((state) => ({
            filters: {
              ...defaultFilters,
              propertyFilter: state.activeProperty
                ? [state.activeProperty]
                : [],
            },
          }));
        },

        getActiveFiltersCount: () => {
          const filters = get().filters;
          let count = 0;

          if (filters.searchTerm.trim()) count++;
          if (filters.statusFilter.length > 0) count++;
          if (filters.reportTypeFilter.length > 0) count++;
          if (filters.conditionStatusFilter.length > 0) count++;
          if (filters.categoryFilter.length > 0) count++;
          if (filters.propertyFilter.length > 0) count++;
          if (filters.tenantFilter.length > 0) count++;
          if (filters.landlordFilter.length > 0) count++;
          if (filters.inspectorFilter.length > 0) count++;
          if (filters.dateRange) count++;
          if (!filters.showSigned) count++;
          if (!filters.showDisputed) count++;
          if (filters.showArchived) count++;
          if (filters.actionRequired !== undefined) count++;
          if (filters.signatureStatus) count++;

          return count;
        },

        getQueryParams: (): ConditionQueryParams => {
          const filters = get().filters;

          return {
            ...(filters.searchTerm && { search: filters.searchTerm }),
            ...(filters.statusFilter.length === 1 && {
              status: filters.statusFilter[0],
            }),
            ...(filters.reportTypeFilter.length === 1 && {
              reportType: filters.reportTypeFilter[0],
            }),
            ...(filters.conditionStatusFilter.length === 1 && {
              overallCondition: filters.conditionStatusFilter[0],
            }),
            ...(filters.propertyFilter.length > 0 && {
              property: filters.propertyFilter[0],
            }),
            ...(filters.tenantFilter.length > 0 && {
              tenant: filters.tenantFilter[0],
            }),
            ...(filters.landlordFilter.length > 0 && {
              landlord: filters.landlordFilter[0],
            }),
            ...(filters.inspectorFilter.length > 0 && {
              inspector: filters.inspectorFilter[0],
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
            limit: get().viewPreferences.itemsPerPage,
          };
        },

        // View preference actions
        setViewMode: (mode: ConditionViewPreferences["viewMode"]) => {
          set((state) => ({
            viewPreferences: { ...state.viewPreferences, viewMode: mode },
          }));
        },

        setItemsPerPage: (count: number) => {
          set((state) => ({
            viewPreferences: { ...state.viewPreferences, itemsPerPage: count },
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
            viewPreferences: { ...state.viewPreferences, compactView: compact },
          }));
        },

        setShowPhotos: (show: boolean) => {
          set((state) => ({
            viewPreferences: { ...state.viewPreferences, showPhotos: show },
          }));
        },

        setGroupBy: (groupBy: ConditionViewPreferences["groupBy"]) => {
          set((state) => ({
            viewPreferences: { ...state.viewPreferences, groupBy },
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

        setActiveProperty: (propertyId: string | null) => {
          set((state) => ({
            activeProperty: propertyId,
            filters: {
              ...state.filters,
              propertyFilter: propertyId ? [propertyId] : [],
            },
          }));
        },

        // Utility actions
        resetStore: () => {
          set({
            selectedConditions: [],
            lastSelectedCondition: null,
            compareList: [],
            modals: defaultModals,
            form: defaultForm,
            filters: defaultFilters,
            isLoading: false,
            bulkActionLoading: false,
            lastRefresh: null,
            activeProperty: null,
          });
        },

        bulkUpdateConditions: (
          _conditionIds: string[],
          _updates: Partial<PropertyCondition>
        ) => {
          set({
            selectedConditions: [],
            bulkActionLoading: false,
          });
        },

        addConditionToSelection: (conditionId: string) => {
          set((state) => ({
            selectedConditions: state.selectedConditions.includes(conditionId)
              ? state.selectedConditions
              : [...state.selectedConditions, conditionId],
          }));
        },

        removeConditionFromSelection: (conditionId: string) => {
          set((state) => ({
            selectedConditions: state.selectedConditions.filter(
              (id) => id !== conditionId
            ),
          }));
        },
      }),
      {
        name: "condition-store",
        partialize: (state) => ({
          viewPreferences: state.viewPreferences,
          filters: {
            sortBy: state.filters.sortBy,
            sortOrder: state.filters.sortOrder,
            showSigned: state.filters.showSigned,
            showDisputed: state.filters.showDisputed,
            showArchived: state.filters.showArchived,
          },
        }),
      }
    ),
    { name: "condition-store" }
  )
);

// Selector hooks for better performance
export const useConditionModals = () =>
  useConditionStore((state) => state.modals);
export const useConditionModal = (modal: keyof ConditionModals) =>
  useConditionStore((state) => state.modals[modal]);
export const useSelectedConditions = () =>
  useConditionStore((state) => state.selectedConditions);
export const useHasSelectedConditions = () =>
  useConditionStore((state) => state.hasSelectedConditions());
export const useSelectedConditionsCount = () =>
  useConditionStore((state) => state.selectedCount());
export const useConditionForm = () => useConditionStore((state) => state.form);
export const useCurrentCondition = () =>
  useConditionStore((state) => state.form.currentCondition);
export const useConditionFilters = () =>
  useConditionStore((state) => state.filters);
export const useConditionQueryParams = () =>
  useConditionStore((state) => state.getQueryParams());
export const useActiveConditionFiltersCount = () =>
  useConditionStore((state) => state.getActiveFiltersCount());
export const useConditionViewPreferences = () =>
  useConditionStore((state) => state.viewPreferences);
export const useConditionViewMode = () =>
  useConditionStore((state) => state.viewPreferences.viewMode);
export const useConditionCompareList = () =>
  useConditionStore((state) => state.compareList);
export const useConditionLoading = () =>
  useConditionStore((state) => state.isLoading);
export const useConditionBulkActionLoading = () =>
  useConditionStore((state) => state.bulkActionLoading);
export const useActiveConditionProperty = () =>
  useConditionStore((state) => state.activeProperty);
