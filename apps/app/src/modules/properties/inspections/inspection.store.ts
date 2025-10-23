import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  InspectionQueryParams,
  InspectionStatus,
  InspectionType,
  PropertyInspection,
} from "./inspection.type";

/**
 * Inspection modal states
 */
type InspectionModals = {
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isCompleteModalOpen: boolean;
  isRescheduleModalOpen: boolean;
  isCancelModalOpen: boolean;
  isViewModalOpen: boolean;
  isReportModalOpen: boolean;
  isTemplateModalOpen: boolean;
  isRecurringModalOpen: boolean;
  isAttachmentModalOpen: boolean;
  isChecklistModalOpen: boolean;
};

/**
 * Inspection form states
 */
type InspectionFormState = {
  currentInspection: Partial<PropertyInspection> | null;
  isSubmitting: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
};

/**
 * Inspection filters and search state
 */
type InspectionFiltersState = {
  searchTerm: string;
  statusFilter: InspectionStatus[];
  typeFilter: InspectionType[];
  propertyFilter: string[];
  inspectorFilter: string[];
  tenantFilter: string[];
  dateRange: {
    startDate?: Date;
    endDate?: Date;
    field: "scheduledDate" | "actualDate" | "createdAt";
  } | null;
  sortBy: "scheduledDate" | "createdAt" | "updatedAt" | "status" | "type";
  sortOrder: "asc" | "desc";
  showCompleted: boolean;
  showCancelled: boolean;
  followUpRequired?: boolean;
  overdue?: boolean;
  upcomingDays?: number;
};

/**
 * Inspection view preferences
 */
type InspectionViewPreferences = {
  viewMode: "table" | "grid" | "calendar" | "list";
  itemsPerPage: number;
  selectedColumns: string[];
  compactView: boolean;
  calendarView: "month" | "week" | "day";
  showWeekends: boolean;
};

/**
 * Main inspection store interface
 */
type InspectionStore = {
  // Selection state
  selectedInspections: string[];
  lastSelectedInspection: string | null;

  // Modal states
  modals: InspectionModals;

  // Form state
  form: InspectionFormState;

  // Filters and search
  filters: InspectionFiltersState;

  // View preferences
  viewPreferences: InspectionViewPreferences;

  // UI state
  isLoading: boolean;
  bulkActionLoading: boolean;
  lastRefresh: Date | null;
  activeProperty: string | null;

  // Selection actions
  setSelectedInspections: (ids: string[]) => void;
  toggleInspectionSelection: (id: string) => void;
  selectAllInspections: (inspectionIds: string[]) => void;
  clearSelectedInspections: () => void;
  isInspectionSelected: (id: string) => boolean;
  hasSelectedInspections: () => boolean;
  selectedCount: () => number;
  setLastSelectedInspection: (id: string | null) => void;

  // Modal actions
  openModal: (modal: keyof InspectionModals, inspectionId?: string) => void;
  closeModal: (modal: keyof InspectionModals) => void;
  closeAllModals: () => void;

  // Form actions
  setCurrentInspection: (
    inspection: Partial<PropertyInspection> | null
  ) => void;
  setFormSubmitting: (isSubmitting: boolean) => void;
  setFormErrors: (errors: Record<string, string>) => void;
  setFormDirty: (isDirty: boolean) => void;
  resetForm: () => void;
  updateFormField: (field: string, value: any) => void;

  // Filter actions
  setSearchTerm: (term: string) => void;
  setStatusFilter: (statuses: InspectionStatus[]) => void;
  setTypeFilter: (types: InspectionType[]) => void;
  setPropertyFilter: (propertyIds: string[]) => void;
  setInspectorFilter: (inspectorIds: string[]) => void;
  setTenantFilter: (tenantIds: string[]) => void;
  setDateRange: (range: InspectionFiltersState["dateRange"]) => void;
  setSortBy: (sortBy: InspectionFiltersState["sortBy"]) => void;
  setSortOrder: (order: "asc" | "desc") => void;
  setShowCompleted: (show: boolean) => void;
  setShowCancelled: (show: boolean) => void;
  setFollowUpRequired: (required?: boolean) => void;
  setOverdue: (overdue?: boolean) => void;
  setUpcomingDays: (days?: number) => void;
  clearFilters: () => void;
  getActiveFiltersCount: () => number;
  getQueryParams: () => InspectionQueryParams;

  // View preference actions
  setViewMode: (mode: InspectionViewPreferences["viewMode"]) => void;
  setItemsPerPage: (count: number) => void;
  setSelectedColumns: (columns: string[]) => void;
  setCompactView: (compact: boolean) => void;
  setCalendarView: (view: "month" | "week" | "day") => void;
  setShowWeekends: (show: boolean) => void;

  // UI state actions
  setLoading: (loading: boolean) => void;
  setBulkActionLoading: (loading: boolean) => void;
  setLastRefresh: (date: Date) => void;
  setActiveProperty: (propertyId: string | null) => void;

  // Utility actions
  resetStore: () => void;
  bulkUpdateInspections: (
    inspectionIds: string[],
    updates: Partial<PropertyInspection>
  ) => void;
  addInspectionToSelection: (inspectionId: string) => void;
  removeInspectionFromSelection: (inspectionId: string) => void;
};

// Default states
const defaultModals: InspectionModals = {
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  isCompleteModalOpen: false,
  isRescheduleModalOpen: false,
  isCancelModalOpen: false,
  isViewModalOpen: false,
  isReportModalOpen: false,
  isTemplateModalOpen: false,
  isRecurringModalOpen: false,
  isAttachmentModalOpen: false,
  isChecklistModalOpen: false,
};

const defaultForm: InspectionFormState = {
  currentInspection: null,
  isSubmitting: false,
  errors: {},
  isDirty: false,
};

const defaultFilters: InspectionFiltersState = {
  searchTerm: "",
  statusFilter: [],
  typeFilter: [],
  propertyFilter: [],
  inspectorFilter: [],
  tenantFilter: [],
  dateRange: null,
  sortBy: "scheduledDate",
  sortOrder: "asc",
  showCompleted: true,
  showCancelled: false,
  followUpRequired: undefined,
  overdue: undefined,
  upcomingDays: undefined,
};

const defaultViewPreferences: InspectionViewPreferences = {
  viewMode: "table",
  itemsPerPage: 25,
  selectedColumns: [
    "property",
    "type",
    "status",
    "scheduledDate",
    "inspector",
    "tenant",
    "actions",
  ],
  compactView: false,
  calendarView: "month",
  showWeekends: true,
};

/**
 * Create the inspection store with persistence for preferences
 */
export const useInspectionStore = create<InspectionStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        selectedInspections: [],
        lastSelectedInspection: null,
        modals: defaultModals,
        form: defaultForm,
        filters: defaultFilters,
        viewPreferences: defaultViewPreferences,
        isLoading: false,
        bulkActionLoading: false,
        lastRefresh: null,
        activeProperty: null,

        // Selection actions
        setSelectedInspections: (ids: string[]) => {
          set({ selectedInspections: ids });
        },

        toggleInspectionSelection: (id: string) => {
          set((state) => {
            const isSelected = state.selectedInspections.includes(id);
            const newSelected = isSelected
              ? state.selectedInspections.filter(
                  (inspectionId) => inspectionId !== id
                )
              : [...state.selectedInspections, id];

            return {
              selectedInspections: newSelected,
              lastSelectedInspection: id,
            };
          });
        },

        selectAllInspections: (inspectionIds: string[]) => {
          set({ selectedInspections: inspectionIds });
        },

        clearSelectedInspections: () => {
          set({ selectedInspections: [], lastSelectedInspection: null });
        },

        isInspectionSelected: (id: string) =>
          get().selectedInspections.includes(id),

        hasSelectedInspections: () => get().selectedInspections.length > 0,

        selectedCount: () => get().selectedInspections.length,

        setLastSelectedInspection: (id: string | null) => {
          set({ lastSelectedInspection: id });
        },

        // Modal actions
        openModal: (modal: keyof InspectionModals, inspectionId?: string) => {
          set((state) => ({
            modals: {
              ...state.modals,
              [modal]: true,
            },
            ...(inspectionId && {
              lastSelectedInspection: inspectionId,
            }),
          }));
        },

        closeModal: (modal: keyof InspectionModals) => {
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
        setCurrentInspection: (
          inspection: Partial<PropertyInspection> | null
        ) => {
          set((state) => ({
            form: {
              ...state.form,
              currentInspection: inspection,
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
          set(() => ({
            form: defaultForm,
          }));
        },

        updateFormField: (field: string, value: any) => {
          set((state) => ({
            form: {
              ...state.form,
              currentInspection: {
                ...state.form.currentInspection,
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

        setStatusFilter: (statuses: InspectionStatus[]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              statusFilter: statuses,
            },
          }));
        },

        setTypeFilter: (types: InspectionType[]) => {
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

        setInspectorFilter: (inspectorIds: string[]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              inspectorFilter: inspectorIds,
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

        setDateRange: (range: InspectionFiltersState["dateRange"]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              dateRange: range,
            },
          }));
        },

        setSortBy: (sortBy: InspectionFiltersState["sortBy"]) => {
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

        setShowCompleted: (show: boolean) => {
          set((state) => ({
            filters: {
              ...state.filters,
              showCompleted: show,
            },
          }));
        },

        setShowCancelled: (show: boolean) => {
          set((state) => ({
            filters: {
              ...state.filters,
              showCancelled: show,
            },
          }));
        },

        setFollowUpRequired: (required?: boolean) => {
          set((state) => ({
            filters: {
              ...state.filters,
              followUpRequired: required,
            },
          }));
        },

        setOverdue: (overdue?: boolean) => {
          set((state) => ({
            filters: {
              ...state.filters,
              overdue,
            },
          }));
        },

        setUpcomingDays: (days?: number) => {
          set((state) => ({
            filters: {
              ...state.filters,
              upcomingDays: days,
            },
          }));
        },

        clearFilters: () => {
          set((state) => ({
            filters: {
              ...defaultFilters,
              // Keep property filter if activeProperty is set
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
          if (filters.typeFilter.length > 0) count++;
          if (filters.propertyFilter.length > 0) count++;
          if (filters.inspectorFilter.length > 0) count++;
          if (filters.tenantFilter.length > 0) count++;
          if (filters.dateRange) count++;
          if (filters.followUpRequired !== undefined) count++;
          if (filters.overdue !== undefined) count++;
          if (filters.upcomingDays !== undefined) count++;
          if (!filters.showCompleted) count++;
          if (filters.showCancelled) count++;

          return count;
        },

        getQueryParams: (): InspectionQueryParams => {
          const filters = get().filters;

          return {
            ...(filters.searchTerm && { search: filters.searchTerm }),
            ...(filters.statusFilter.length > 0 && {
              status:
                filters.statusFilter.length === 1
                  ? filters.statusFilter[0]
                  : undefined,
            }),
            ...(filters.typeFilter.length > 0 && {
              type:
                filters.typeFilter.length === 1
                  ? filters.typeFilter[0]
                  : undefined,
            }),
            ...(filters.propertyFilter.length > 0 && {
              property: filters.propertyFilter[0],
            }),
            ...(filters.inspectorFilter.length > 0 && {
              inspector: filters.inspectorFilter[0],
            }),
            ...(filters.tenantFilter.length > 0 && {
              tenant: filters.tenantFilter[0],
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
            ...(filters.followUpRequired !== undefined && {
              followUpRequired: filters.followUpRequired,
            }),
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            limit: get().viewPreferences.itemsPerPage,
          };
        },

        // View preference actions
        setViewMode: (mode: InspectionViewPreferences["viewMode"]) => {
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

        setCalendarView: (view: "month" | "week" | "day") => {
          set((state) => ({
            viewPreferences: {
              ...state.viewPreferences,
              calendarView: view,
            },
          }));
        },

        setShowWeekends: (show: boolean) => {
          set((state) => ({
            viewPreferences: {
              ...state.viewPreferences,
              showWeekends: show,
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
            selectedInspections: [],
            lastSelectedInspection: null,
            modals: defaultModals,
            form: defaultForm,
            filters: defaultFilters,
            isLoading: false,
            bulkActionLoading: false,
            lastRefresh: null,
            activeProperty: null,
            // Don't reset view preferences as they should persist
          });
        },

        bulkUpdateInspections: (
          _inspectionIds: string[],
          _updates: Partial<PropertyInspection>
        ) => {
          // This would typically trigger API calls to update multiple inspections
          // For now, we'll just clear the selection after bulk operations
          set({
            selectedInspections: [],
            bulkActionLoading: false,
          });
        },

        addInspectionToSelection: (inspectionId: string) => {
          set((state) => ({
            selectedInspections: state.selectedInspections.includes(
              inspectionId
            )
              ? state.selectedInspections
              : [...state.selectedInspections, inspectionId],
          }));
        },

        removeInspectionFromSelection: (inspectionId: string) => {
          set((state) => ({
            selectedInspections: state.selectedInspections.filter(
              (id) => id !== inspectionId
            ),
          }));
        },
      }),
      {
        name: "inspection-store",
        // Only persist certain parts of the store
        partialize: (state) => ({
          viewPreferences: state.viewPreferences,
          filters: {
            sortBy: state.filters.sortBy,
            sortOrder: state.filters.sortOrder,
            showCompleted: state.filters.showCompleted,
            showCancelled: state.filters.showCancelled,
          },
        }),
      }
    ),
    {
      name: "inspection-store",
    }
  )
);

/**
 * Selector hooks for better performance
 */

// Modal selectors
export const useInspectionModals = () =>
  useInspectionStore((state) => state.modals);
export const useInspectionModal = (modal: keyof InspectionModals) =>
  useInspectionStore((state) => state.modals[modal]);

// Selection selectors
export const useSelectedInspections = () =>
  useInspectionStore((state) => state.selectedInspections);
export const useHasSelectedInspections = () =>
  useInspectionStore((state) => state.hasSelectedInspections());
export const useSelectedInspectionsCount = () =>
  useInspectionStore((state) => state.selectedCount());

// Form selectors
export const useInspectionForm = () =>
  useInspectionStore((state) => state.form);
export const useCurrentInspection = () =>
  useInspectionStore((state) => state.form.currentInspection);

// Filter selectors
export const useInspectionFilters = () =>
  useInspectionStore((state) => state.filters);
export const useInspectionQueryParams = () =>
  useInspectionStore((state) => state.getQueryParams());
export const useActiveFiltersCount = () =>
  useInspectionStore((state) => state.getActiveFiltersCount());

// View preference selectors
export const useInspectionViewPreferences = () =>
  useInspectionStore((state) => state.viewPreferences);
export const useInspectionViewMode = () =>
  useInspectionStore((state) => state.viewPreferences.viewMode);

// UI state selectors
export const useInspectionLoading = () =>
  useInspectionStore((state) => state.isLoading);
export const useBulkActionLoading = () =>
  useInspectionStore((state) => state.bulkActionLoading);
export const useActiveProperty = () =>
  useInspectionStore((state) => state.activeProperty);
