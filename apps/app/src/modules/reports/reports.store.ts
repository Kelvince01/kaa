import { create } from "zustand";
import type {
  IReportDefinition,
  IReportExecution,
  IReportSchedule,
  IReportTemplate,
  ReportFilterState,
  ReportSortState,
  ReportViewMode,
} from "./reports.type";

type ReportsStore = {
  // Reports
  reports: IReportDefinition[];
  selectedReport: IReportDefinition | null;
  reportsLoading: boolean;
  reportsPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  } | null;

  // Executions
  executions: IReportExecution[];
  selectedExecution: IReportExecution | null;
  executionsLoading: boolean;

  // Schedules
  schedules: IReportSchedule[];
  selectedSchedule: IReportSchedule | null;
  schedulesLoading: boolean;

  // Templates
  templates: IReportTemplate[];
  systemTemplates: IReportTemplate[];
  selectedTemplate: IReportTemplate | null;
  templatesLoading: boolean;

  // UI State
  viewMode: ReportViewMode;
  filters: ReportFilterState;
  sort: ReportSortState;
  searchQuery: string;

  // Actions - Reports
  setReports: (reports: IReportDefinition[]) => void;
  addReport: (report: IReportDefinition) => void;
  updateReport: (reportId: string, report: Partial<IReportDefinition>) => void;
  removeReport: (reportId: string) => void;
  setSelectedReport: (report: IReportDefinition | null) => void;
  setReportsLoading: (loading: boolean) => void;
  setReportsPagination: (pagination: ReportsStore["reportsPagination"]) => void;

  // Actions - Executions
  setExecutions: (executions: IReportExecution[]) => void;
  addExecution: (execution: IReportExecution) => void;
  updateExecution: (
    executionId: string,
    execution: Partial<IReportExecution>
  ) => void;
  setSelectedExecution: (execution: IReportExecution | null) => void;
  setExecutionsLoading: (loading: boolean) => void;

  // Actions - Schedules
  setSchedules: (schedules: IReportSchedule[]) => void;
  addSchedule: (schedule: IReportSchedule) => void;
  updateSchedule: (
    scheduleId: string,
    schedule: Partial<IReportSchedule>
  ) => void;
  removeSchedule: (scheduleId: string) => void;
  setSelectedSchedule: (schedule: IReportSchedule | null) => void;
  setSchedulesLoading: (loading: boolean) => void;

  // Actions - Templates
  setTemplates: (templates: IReportTemplate[]) => void;
  setSystemTemplates: (templates: IReportTemplate[]) => void;
  addTemplate: (template: IReportTemplate) => void;
  updateTemplate: (
    templateId: string,
    template: Partial<IReportTemplate>
  ) => void;
  removeTemplate: (templateId: string) => void;
  setSelectedTemplate: (template: IReportTemplate | null) => void;
  setTemplatesLoading: (loading: boolean) => void;

  // Actions - UI State
  setViewMode: (mode: ReportViewMode) => void;
  setFilters: (filters: Partial<ReportFilterState>) => void;
  setSort: (sort: ReportSortState) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
};

export const useReportsStore = create<ReportsStore>((set) => ({
  // Initial State - Reports
  reports: [],
  selectedReport: null,
  reportsLoading: false,
  reportsPagination: null,

  // Initial State - Executions
  executions: [],
  selectedExecution: null,
  executionsLoading: false,

  // Initial State - Schedules
  schedules: [],
  selectedSchedule: null,
  schedulesLoading: false,

  // Initial State - Templates
  templates: [],
  systemTemplates: [],
  selectedTemplate: null,
  templatesLoading: false,

  // Initial State - UI
  viewMode: "table",
  filters: {},
  sort: { field: "createdAt", order: "desc" },
  searchQuery: "",

  // Actions - Reports
  setReports: (reports) => set({ reports }),
  addReport: (report) =>
    set((state) => ({ reports: [report, ...state.reports] })),
  updateReport: (reportId, report) =>
    set((state) => ({
      reports: state.reports.map((r) =>
        r._id.toString() === reportId ? { ...r, ...report } : r
      ),
      selectedReport:
        state.selectedReport?._id.toString() === reportId
          ? { ...state.selectedReport, ...report }
          : state.selectedReport,
    })),
  removeReport: (reportId) =>
    set((state) => ({
      reports: state.reports.filter((r) => r._id.toString() !== reportId),
      selectedReport:
        state.selectedReport?._id.toString() === reportId
          ? null
          : state.selectedReport,
    })),
  setSelectedReport: (report) => set({ selectedReport: report }),
  setReportsLoading: (loading) => set({ reportsLoading: loading }),
  setReportsPagination: (pagination) => set({ reportsPagination: pagination }),

  // Actions - Executions
  setExecutions: (executions) => set({ executions }),
  addExecution: (execution) =>
    set((state) => ({ executions: [execution, ...state.executions] })),
  updateExecution: (executionId, execution) =>
    set((state) => ({
      executions: state.executions.map((e) =>
        e._id.toString() === executionId ? { ...e, ...execution } : e
      ),
      selectedExecution:
        state.selectedExecution?._id.toString() === executionId
          ? { ...state.selectedExecution, ...execution }
          : state.selectedExecution,
    })),
  setSelectedExecution: (execution) => set({ selectedExecution: execution }),
  setExecutionsLoading: (loading) => set({ executionsLoading: loading }),

  // Actions - Schedules
  setSchedules: (schedules) => set({ schedules }),
  addSchedule: (schedule) =>
    set((state) => ({ schedules: [schedule, ...state.schedules] })),
  updateSchedule: (scheduleId, schedule) =>
    set((state) => ({
      schedules: state.schedules.map((s) =>
        s._id?.toString() === scheduleId ? { ...s, ...schedule } : s
      ),
      selectedSchedule:
        state.selectedSchedule?._id?.toString() === scheduleId
          ? { ...state.selectedSchedule, ...schedule }
          : state.selectedSchedule,
    })),
  removeSchedule: (scheduleId) =>
    set((state) => ({
      schedules: state.schedules.filter(
        (s) => s._id?.toString() !== scheduleId
      ),
      selectedSchedule:
        state.selectedSchedule?._id?.toString() === scheduleId
          ? null
          : state.selectedSchedule,
    })),
  setSelectedSchedule: (schedule) => set({ selectedSchedule: schedule }),
  setSchedulesLoading: (loading) => set({ schedulesLoading: loading }),

  // Actions - Templates
  setTemplates: (templates) => set({ templates }),
  setSystemTemplates: (templates) => set({ systemTemplates: templates }),
  addTemplate: (template) =>
    set((state) => ({ templates: [template, ...state.templates] })),
  updateTemplate: (templateId, template) =>
    set((state) => ({
      templates: state.templates.map((t) =>
        t._id.toString() === templateId ? { ...t, ...template } : t
      ),
      selectedTemplate:
        state.selectedTemplate?._id.toString() === templateId
          ? { ...state.selectedTemplate, ...template }
          : state.selectedTemplate,
    })),
  removeTemplate: (templateId) =>
    set((state) => ({
      templates: state.templates.filter((t) => t._id.toString() !== templateId),
      selectedTemplate:
        state.selectedTemplate?._id.toString() === templateId
          ? null
          : state.selectedTemplate,
    })),
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  setTemplatesLoading: (loading) => set({ templatesLoading: loading }),

  // Actions - UI State
  setViewMode: (mode) => set({ viewMode: mode }),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  setSort: (sort) => set({ sort }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  resetFilters: () =>
    set({
      filters: {},
      sort: { field: "createdAt", order: "desc" },
      searchQuery: "",
    }),
}));
