import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  WorkOrder,
  WorkOrderPriority,
  WorkOrderQueryParams,
  WorkOrderStatus,
  WorkOrderType,
} from "./work-order.type";

/**
 * Work order modal states
 */
type WorkOrderModals = {
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  isAssignModalOpen: boolean;
  isCompleteModalOpen: boolean;
  isCancelModalOpen: boolean;
  isViewModalOpen: boolean;
  isScheduleModalOpen: boolean;
  isRescheduleModalOpen: boolean;
  isTimeEntryModalOpen: boolean;
  isMaterialModalOpen: boolean;
  isAttachmentModalOpen: boolean;
  isTemplateModalOpen: boolean;
  isRecurringModalOpen: boolean;
  isReportModalOpen: boolean;
  isQualityCheckModalOpen: boolean;
};

/**
 * Work order form states
 */
type WorkOrderFormState = {
  currentWorkOrder: Partial<WorkOrder> | null;
  isSubmitting: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
};

/**
 * Work order filters and search state
 */
type WorkOrderFiltersState = {
  searchTerm: string;
  statusFilter: WorkOrderStatus[];
  priorityFilter: WorkOrderPriority[];
  typeFilter: WorkOrderType[];
  propertyFilter: string[];
  contractorFilter: string[];
  dateRange: {
    startDate?: Date;
    endDate?: Date;
    field: "scheduledDate" | "createdAt" | "actualStartDate" | "actualEndDate";
  } | null;
  costRange: {
    min?: number;
    max?: number;
  } | null;
  sortBy:
    | "createdAt"
    | "updatedAt"
    | "scheduledDate"
    | "priority"
    | "status"
    | "workOrderNumber";
  sortOrder: "asc" | "desc";
  showCompleted: boolean;
  showCancelled: boolean;
  overdue?: boolean;
  unassigned?: boolean;
  qualityCheckRequired?: boolean;
  tagsFilter: string[];
};

/**
 * Work order view preferences
 */
type WorkOrderViewPreferences = {
  viewMode: "table" | "grid" | "calendar" | "kanban";
  itemsPerPage: number;
  selectedColumns: string[];
  compactView: boolean;
  calendarView: "month" | "week" | "day";
  showWeekends: boolean;
  kanbanGroupBy: "status" | "priority" | "contractor" | "property";
};

/**
 * Main work order store interface
 */
type WorkOrderStore = {
  // Selection state
  selectedWorkOrders: string[];
  lastSelectedWorkOrder: string | null;

  // Modal states
  modals: WorkOrderModals;

  // Form state
  form: WorkOrderFormState;

  // Filters and search
  filters: WorkOrderFiltersState;

  // View preferences
  viewPreferences: WorkOrderViewPreferences;

  // UI state
  isLoading: boolean;
  bulkActionLoading: boolean;
  lastRefresh: Date | null;
  activeProperty: string | null;
  activeContractor: string | null;

  // Selection actions
  setSelectedWorkOrders: (ids: string[]) => void;
  toggleWorkOrderSelection: (id: string) => void;
  selectAllWorkOrders: (workOrderIds: string[]) => void;
  clearSelectedWorkOrders: () => void;
  isWorkOrderSelected: (id: string) => boolean;
  hasSelectedWorkOrders: () => boolean;
  selectedCount: () => number;
  setLastSelectedWorkOrder: (id: string | null) => void;

  // Modal actions
  openModal: (modal: keyof WorkOrderModals, workOrderId?: string) => void;
  closeModal: (modal: keyof WorkOrderModals) => void;
  closeAllModals: () => void;

  // Form actions
  setCurrentWorkOrder: (workOrder: Partial<WorkOrder> | null) => void;
  setFormSubmitting: (isSubmitting: boolean) => void;
  setFormErrors: (errors: Record<string, string>) => void;
  setFormDirty: (isDirty: boolean) => void;
  resetForm: () => void;
  updateFormField: (field: string, value: any) => void;

  // Filter actions
  setSearchTerm: (term: string) => void;
  setStatusFilter: (statuses: WorkOrderStatus[]) => void;
  setPriorityFilter: (priorities: WorkOrderPriority[]) => void;
  setTypeFilter: (types: WorkOrderType[]) => void;
  setPropertyFilter: (propertyIds: string[]) => void;
  setContractorFilter: (contractorIds: string[]) => void;
  setDateRange: (range: WorkOrderFiltersState["dateRange"]) => void;
  setCostRange: (range: WorkOrderFiltersState["costRange"]) => void;
  setSortBy: (sortBy: WorkOrderFiltersState["sortBy"]) => void;
  setSortOrder: (order: "asc" | "desc") => void;
  setShowCompleted: (show: boolean) => void;
  setShowCancelled: (show: boolean) => void;
  setOverdue: (overdue?: boolean) => void;
  setUnassigned: (unassigned?: boolean) => void;
  setQualityCheckRequired: (required?: boolean) => void;
  setTagsFilter: (tags: string[]) => void;
  clearFilters: () => void;
  getActiveFiltersCount: () => number;
  getQueryParams: () => WorkOrderQueryParams;

  // View preference actions
  setViewMode: (mode: WorkOrderViewPreferences["viewMode"]) => void;
  setItemsPerPage: (count: number) => void;
  setSelectedColumns: (columns: string[]) => void;
  setCompactView: (compact: boolean) => void;
  setCalendarView: (view: "month" | "week" | "day") => void;
  setShowWeekends: (show: boolean) => void;
  setKanbanGroupBy: (
    groupBy: "status" | "priority" | "contractor" | "property"
  ) => void;

  // UI state actions
  setLoading: (loading: boolean) => void;
  setBulkActionLoading: (loading: boolean) => void;
  setLastRefresh: (date: Date) => void;
  setActiveProperty: (propertyId: string | null) => void;
  setActiveContractor: (contractorId: string | null) => void;

  // Utility actions
  resetStore: () => void;
  bulkUpdateWorkOrders: (
    workOrderIds: string[],
    updates: Partial<WorkOrder>
  ) => void;
  addWorkOrderToSelection: (workOrderId: string) => void;
  removeWorkOrderFromSelection: (workOrderId: string) => void;
};

// Default states
const defaultModals: WorkOrderModals = {
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  isAssignModalOpen: false,
  isCompleteModalOpen: false,
  isCancelModalOpen: false,
  isViewModalOpen: false,
  isScheduleModalOpen: false,
  isRescheduleModalOpen: false,
  isTimeEntryModalOpen: false,
  isMaterialModalOpen: false,
  isAttachmentModalOpen: false,
  isTemplateModalOpen: false,
  isRecurringModalOpen: false,
  isReportModalOpen: false,
  isQualityCheckModalOpen: false,
};

const defaultForm: WorkOrderFormState = {
  currentWorkOrder: null,
  isSubmitting: false,
  errors: {},
  isDirty: false,
};

const defaultFilters: WorkOrderFiltersState = {
  searchTerm: "",
  statusFilter: [],
  priorityFilter: [],
  typeFilter: [],
  propertyFilter: [],
  contractorFilter: [],
  dateRange: null,
  costRange: null,
  sortBy: "createdAt",
  sortOrder: "desc",
  showCompleted: true,
  showCancelled: false,
  overdue: undefined,
  unassigned: undefined,
  qualityCheckRequired: undefined,
  tagsFilter: [],
};

const defaultViewPreferences: WorkOrderViewPreferences = {
  viewMode: "table",
  itemsPerPage: 25,
  selectedColumns: [
    "workOrderNumber",
    "title",
    "property",
    "type",
    "priority",
    "status",
    "contractor",
    "scheduledDate",
    "actions",
  ],
  compactView: false,
  calendarView: "month",
  showWeekends: true,
  kanbanGroupBy: "status",
};

/**
 * Create the work order store with persistence for preferences
 */
export const useWorkOrderStore = create<WorkOrderStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        selectedWorkOrders: [],
        lastSelectedWorkOrder: null,
        modals: defaultModals,
        form: defaultForm,
        filters: defaultFilters,
        viewPreferences: defaultViewPreferences,
        isLoading: false,
        bulkActionLoading: false,
        lastRefresh: null,
        activeProperty: null,
        activeContractor: null,

        // Selection actions
        setSelectedWorkOrders: (ids: string[]) => {
          set({ selectedWorkOrders: ids });
        },

        toggleWorkOrderSelection: (id: string) => {
          set((state) => {
            const isSelected = state.selectedWorkOrders.includes(id);
            const newSelected = isSelected
              ? state.selectedWorkOrders.filter(
                  (workOrderId) => workOrderId !== id
                )
              : [...state.selectedWorkOrders, id];

            return {
              selectedWorkOrders: newSelected,
              lastSelectedWorkOrder: id,
            };
          });
        },

        selectAllWorkOrders: (workOrderIds: string[]) => {
          set({ selectedWorkOrders: workOrderIds });
        },

        clearSelectedWorkOrders: () => {
          set({ selectedWorkOrders: [], lastSelectedWorkOrder: null });
        },

        isWorkOrderSelected: (id: string) =>
          get().selectedWorkOrders.includes(id),

        hasSelectedWorkOrders: () => get().selectedWorkOrders.length > 0,

        selectedCount: () => get().selectedWorkOrders.length,

        setLastSelectedWorkOrder: (id: string | null) => {
          set({ lastSelectedWorkOrder: id });
        },

        // Modal actions
        openModal: (modal: keyof WorkOrderModals, workOrderId?: string) => {
          set((state) => ({
            modals: {
              ...state.modals,
              [modal]: true,
            },
            ...(workOrderId && {
              lastSelectedWorkOrder: workOrderId,
            }),
          }));
        },

        closeModal: (modal: keyof WorkOrderModals) => {
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
        setCurrentWorkOrder: (workOrder: Partial<WorkOrder> | null) => {
          set((state) => ({
            form: {
              ...state.form,
              currentWorkOrder: workOrder,
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
              currentWorkOrder: {
                ...state.form.currentWorkOrder,
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

        setStatusFilter: (statuses: WorkOrderStatus[]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              statusFilter: statuses,
            },
          }));
        },

        setPriorityFilter: (priorities: WorkOrderPriority[]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              priorityFilter: priorities,
            },
          }));
        },

        setTypeFilter: (types: WorkOrderType[]) => {
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

        setContractorFilter: (contractorIds: string[]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              contractorFilter: contractorIds,
            },
          }));
        },

        setDateRange: (range: WorkOrderFiltersState["dateRange"]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              dateRange: range,
            },
          }));
        },

        setCostRange: (range: WorkOrderFiltersState["costRange"]) => {
          set((state) => ({
            filters: {
              ...state.filters,
              costRange: range,
            },
          }));
        },

        setSortBy: (sortBy: WorkOrderFiltersState["sortBy"]) => {
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

        setOverdue: (overdue?: boolean) => {
          set((state) => ({
            filters: {
              ...state.filters,
              overdue,
            },
          }));
        },

        setUnassigned: (unassigned?: boolean) => {
          set((state) => ({
            filters: {
              ...state.filters,
              unassigned,
            },
          }));
        },

        setQualityCheckRequired: (required?: boolean) => {
          set((state) => ({
            filters: {
              ...state.filters,
              qualityCheckRequired: required,
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
          set((state) => ({
            filters: {
              ...defaultFilters,
              // Keep property and contractor filters if active
              propertyFilter: state.activeProperty
                ? [state.activeProperty]
                : [],
              contractorFilter: state.activeContractor
                ? [state.activeContractor]
                : [],
            },
          }));
        },

        getActiveFiltersCount: () => {
          const filters = get().filters;
          let count = 0;

          if (filters.searchTerm.trim()) count++;
          if (filters.statusFilter.length > 0) count++;
          if (filters.priorityFilter.length > 0) count++;
          if (filters.typeFilter.length > 0) count++;
          if (filters.propertyFilter.length > 0) count++;
          if (filters.contractorFilter.length > 0) count++;
          if (filters.dateRange) count++;
          if (filters.costRange?.min || filters.costRange?.max) count++;
          if (filters.tagsFilter.length > 0) count++;
          if (!filters.showCompleted) count++;
          if (filters.showCancelled) count++;
          if (filters.overdue !== undefined) count++;
          if (filters.unassigned !== undefined) count++;
          if (filters.qualityCheckRequired !== undefined) count++;

          return count;
        },

        getQueryParams: (): WorkOrderQueryParams => {
          const filters = get().filters;

          return {
            ...(filters.searchTerm && { search: filters.searchTerm }),
            ...(filters.statusFilter.length > 0 && {
              status:
                filters.statusFilter.length === 1
                  ? filters.statusFilter[0]
                  : undefined,
            }),
            ...(filters.priorityFilter.length > 0 && {
              priority:
                filters.priorityFilter.length === 1
                  ? filters.priorityFilter[0]
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
            ...(filters.contractorFilter.length > 0 && {
              contractor: filters.contractorFilter[0],
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
            ...(filters.overdue !== undefined && { overdue: filters.overdue }),
            ...(filters.tagsFilter.length > 0 && { tags: filters.tagsFilter }),
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            limit: get().viewPreferences.itemsPerPage,
          };
        },

        // View preference actions
        setViewMode: (mode: WorkOrderViewPreferences["viewMode"]) => {
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

        setKanbanGroupBy: (
          groupBy: "status" | "priority" | "contractor" | "property"
        ) => {
          set((state) => ({
            viewPreferences: {
              ...state.viewPreferences,
              kanbanGroupBy: groupBy,
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

        setActiveContractor: (contractorId: string | null) => {
          set((state) => ({
            activeContractor: contractorId,
            filters: {
              ...state.filters,
              contractorFilter: contractorId ? [contractorId] : [],
            },
          }));
        },

        // Utility actions
        resetStore: () => {
          set({
            selectedWorkOrders: [],
            lastSelectedWorkOrder: null,
            modals: defaultModals,
            form: defaultForm,
            filters: defaultFilters,
            isLoading: false,
            bulkActionLoading: false,
            lastRefresh: null,
            activeProperty: null,
            activeContractor: null,
            // Don't reset view preferences as they should persist
          });
        },

        bulkUpdateWorkOrders: (
          _workOrderIds: string[],
          _updates: Partial<WorkOrder>
        ) => {
          // This would typically trigger API calls to update multiple work orders
          // For now, we'll just clear the selection after bulk operations
          set({
            selectedWorkOrders: [],
            bulkActionLoading: false,
          });
        },

        addWorkOrderToSelection: (workOrderId: string) => {
          set((state) => ({
            selectedWorkOrders: state.selectedWorkOrders.includes(workOrderId)
              ? state.selectedWorkOrders
              : [...state.selectedWorkOrders, workOrderId],
          }));
        },

        removeWorkOrderFromSelection: (workOrderId: string) => {
          set((state) => ({
            selectedWorkOrders: state.selectedWorkOrders.filter(
              (id) => id !== workOrderId
            ),
          }));
        },
      }),
      {
        name: "work-order-store",
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
      name: "work-order-store",
    }
  )
);

/**
 * Selector hooks for better performance
 */

// Modal selectors
export const useWorkOrderModals = () =>
  useWorkOrderStore((state) => state.modals);
export const useWorkOrderModal = (modal: keyof WorkOrderModals) =>
  useWorkOrderStore((state) => state.modals[modal]);

// Selection selectors
export const useSelectedWorkOrders = () =>
  useWorkOrderStore((state) => state.selectedWorkOrders);
export const useHasSelectedWorkOrders = () =>
  useWorkOrderStore((state) => state.hasSelectedWorkOrders());
export const useSelectedWorkOrdersCount = () =>
  useWorkOrderStore((state) => state.selectedCount());

// Form selectors
export const useWorkOrderForm = () => useWorkOrderStore((state) => state.form);
export const useCurrentWorkOrder = () =>
  useWorkOrderStore((state) => state.form.currentWorkOrder);

// Filter selectors
export const useWorkOrderFilters = () =>
  useWorkOrderStore((state) => state.filters);
export const useWorkOrderQueryParams = () =>
  useWorkOrderStore((state) => state.getQueryParams());
export const useActiveFiltersCount = () =>
  useWorkOrderStore((state) => state.getActiveFiltersCount());

// View preference selectors
export const useWorkOrderViewPreferences = () =>
  useWorkOrderStore((state) => state.viewPreferences);
export const useWorkOrderViewMode = () =>
  useWorkOrderStore((state) => state.viewPreferences.viewMode);

// UI state selectors
export const useWorkOrderLoading = () =>
  useWorkOrderStore((state) => state.isLoading);
export const useBulkActionLoading = () =>
  useWorkOrderStore((state) => state.bulkActionLoading);
export const useActiveProperty = () =>
  useWorkOrderStore((state) => state.activeProperty);
export const useActiveContractor = () =>
  useWorkOrderStore((state) => state.activeContractor);
