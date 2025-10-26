import { config } from "@kaa/config";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  Asset,
  AssetFilters,
  Expense,
  ExpenseFilters,
  FinancialDashboardData,
  FinancialReport,
  FinancialSettings,
  ReportFilters,
  TaxReport,
} from "./financials.type";

type FinancialsState = {
  // Financial Reports
  reports: FinancialReport[];
  currentReport: FinancialReport | null;
  reportsLoading: boolean;
  reportFilters: ReportFilters;

  // Tax Reports
  taxReports: TaxReport[];
  currentTaxReport: TaxReport | null;
  taxReportsLoading: boolean;

  // Expenses
  expenses: Expense[];
  currentExpense: Expense | null;
  expensesLoading: boolean;
  expenseFilters: ExpenseFilters;
  expenseCategories: string[];

  // Assets
  assets: Asset[];
  currentAsset: Asset | null;
  assetsLoading: boolean;
  assetFilters: AssetFilters;

  // Settings
  settings: FinancialSettings | null;
  settingsLoading: boolean;

  // Dashboard
  dashboardData: FinancialDashboardData | null;
  dashboardLoading: boolean;

  // UI State
  selectedTab: string;
  sidebarOpen: boolean;

  // Pagination
  reportsPagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  expensesPagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  assetsPagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
};

type FinancialsActions = {
  // Financial Reports Actions
  setReports: (reports: FinancialReport[]) => void;
  setCurrentReport: (report: FinancialReport | null) => void;
  setReportsLoading: (loading: boolean) => void;
  setReportFilters: (filters: ReportFilters) => void;
  updateReportFilters: (filters: Partial<ReportFilters>) => void;
  addReport: (report: FinancialReport) => void;
  updateReport: (id: string, report: Partial<FinancialReport>) => void;
  removeReport: (id: string) => void;
  setReportsPagination: (
    pagination: typeof initialState.reportsPagination
  ) => void;

  // Tax Reports Actions
  setTaxReports: (reports: TaxReport[]) => void;
  setCurrentTaxReport: (report: TaxReport | null) => void;
  setTaxReportsLoading: (loading: boolean) => void;
  addTaxReport: (report: TaxReport) => void;
  updateTaxReport: (id: string, report: Partial<TaxReport>) => void;
  removeTaxReport: (id: string) => void;

  // Expenses Actions
  setExpenses: (expenses: Expense[]) => void;
  setCurrentExpense: (expense: Expense | null) => void;
  setExpensesLoading: (loading: boolean) => void;
  setExpenseFilters: (filters: ExpenseFilters) => void;
  updateExpenseFilters: (filters: Partial<ExpenseFilters>) => void;
  setExpenseCategories: (categories: string[]) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  removeExpense: (id: string) => void;
  setExpensesPagination: (
    pagination: FinancialsState["expensesPagination"]
  ) => void;

  // Assets Actions
  setAssets: (assets: Asset[]) => void;
  setCurrentAsset: (asset: Asset | null) => void;
  setAssetsLoading: (loading: boolean) => void;
  setAssetFilters: (filters: AssetFilters) => void;
  updateAssetFilters: (filters: Partial<AssetFilters>) => void;
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, asset: Partial<Asset>) => void;
  removeAsset: (id: string) => void;
  setAssetsPagination: (
    pagination: FinancialsState["assetsPagination"]
  ) => void;

  // Settings Actions
  setSettings: (settings: FinancialSettings | null) => void;
  setSettingsLoading: (loading: boolean) => void;
  updateSettings: (settings: Partial<FinancialSettings>) => void;

  // Dashboard Actions
  setDashboardData: (data: FinancialDashboardData | null) => void;
  setDashboardLoading: (loading: boolean) => void;

  // UI Actions
  setSelectedTab: (tab: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Utility Actions
  resetState: () => void;
  clearCurrentItems: () => void;
};

const initialState: FinancialsState = {
  // Financial Reports
  reports: [],
  currentReport: null,
  reportsLoading: false,
  reportFilters: {
    page: 1,
    limit: 10,
  },

  // Tax Reports
  taxReports: [],
  currentTaxReport: null,
  taxReportsLoading: false,

  // Expenses
  expenses: [],
  currentExpense: null,
  expensesLoading: false,
  expenseFilters: {
    page: 1,
    limit: 10,
  },
  expenseCategories: [],

  // Assets
  assets: [],
  currentAsset: null,
  assetsLoading: false,
  assetFilters: {
    page: 1,
    limit: 10,
  },

  // Settings
  settings: null,
  settingsLoading: false,

  // Dashboard
  dashboardData: null,
  dashboardLoading: false,

  // UI State
  selectedTab: "overview",
  sidebarOpen: false,

  // Pagination
  reportsPagination: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  },
  expensesPagination: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  },
  assetsPagination: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  },
};

export const useFinancialsStore = create<FinancialsState & FinancialsActions>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // Financial Reports Actions
        setReports: (reports) => set({ reports }),
        setCurrentReport: (report) => set({ currentReport: report }),
        setReportsLoading: (loading) => set({ reportsLoading: loading }),
        setReportFilters: (filters) => set({ reportFilters: filters }),
        updateReportFilters: (filters) =>
          set((state) => ({
            reportFilters: { ...state.reportFilters, ...filters },
          })),
        addReport: (report) =>
          set((state) => ({
            reports: [report, ...state.reports],
          })),
        updateReport: (id, reportUpdate) =>
          set((state) => ({
            reports: state.reports.map((report) =>
              report._id === id ? { ...report, ...reportUpdate } : report
            ),
            currentReport:
              state.currentReport?._id === id
                ? { ...state.currentReport, ...reportUpdate }
                : state.currentReport,
          })),
        removeReport: (id) =>
          set((state) => ({
            reports: state.reports.filter((report) => report._id !== id),
            currentReport:
              state.currentReport?._id === id ? null : state.currentReport,
          })),
        setReportsPagination: (pagination) =>
          set({ reportsPagination: pagination }),

        // Tax Reports Actions
        setTaxReports: (reports) => set({ taxReports: reports }),
        setCurrentTaxReport: (report) => set({ currentTaxReport: report }),
        setTaxReportsLoading: (loading) => set({ taxReportsLoading: loading }),
        addTaxReport: (report) =>
          set((state) => ({
            taxReports: [report, ...state.taxReports],
          })),
        updateTaxReport: (id, reportUpdate) =>
          set((state) => ({
            taxReports: state.taxReports.map((report) =>
              report._id === id ? { ...report, ...reportUpdate } : report
            ),
            currentTaxReport:
              state.currentTaxReport?._id === id
                ? { ...state.currentTaxReport, ...reportUpdate }
                : state.currentTaxReport,
          })),
        removeTaxReport: (id) =>
          set((state) => ({
            taxReports: state.taxReports.filter((report) => report._id !== id),
            currentTaxReport:
              state.currentTaxReport?._id === id
                ? null
                : state.currentTaxReport,
          })),

        // Expenses Actions
        setExpenses: (expenses) => set({ expenses }),
        setCurrentExpense: (expense) => set({ currentExpense: expense }),
        setExpensesLoading: (loading) => set({ expensesLoading: loading }),
        setExpenseFilters: (filters) => set({ expenseFilters: filters }),
        updateExpenseFilters: (filters) =>
          set((state) => ({
            expenseFilters: { ...state.expenseFilters, ...filters },
          })),
        setExpenseCategories: (categories) =>
          set({ expenseCategories: categories }),
        addExpense: (expense) =>
          set((state) => ({
            expenses: [expense, ...state.expenses],
          })),
        updateExpense: (id, expenseUpdate) =>
          set((state) => ({
            expenses: state.expenses.map((expense) =>
              expense._id === id ? { ...expense, ...expenseUpdate } : expense
            ),
            currentExpense:
              state.currentExpense?._id === id
                ? { ...state.currentExpense, ...expenseUpdate }
                : state.currentExpense,
          })),
        removeExpense: (id) =>
          set((state) => ({
            expenses: state.expenses.filter((expense) => expense._id !== id),
            currentExpense:
              state.currentExpense?._id === id ? null : state.currentExpense,
          })),
        setExpensesPagination: (pagination) =>
          set({ expensesPagination: pagination }),

        // Assets Actions
        setAssets: (assets) => set({ assets }),
        setCurrentAsset: (asset) => set({ currentAsset: asset }),
        setAssetsLoading: (loading) => set({ assetsLoading: loading }),
        setAssetFilters: (filters) => set({ assetFilters: filters }),
        updateAssetFilters: (filters) =>
          set((state) => ({
            assetFilters: { ...state.assetFilters, ...filters },
          })),
        addAsset: (asset) =>
          set((state) => ({
            assets: [asset, ...state.assets],
          })),
        updateAsset: (id, assetUpdate) =>
          set((state) => ({
            assets: state.assets.map((asset) =>
              asset._id === id ? { ...asset, ...assetUpdate } : asset
            ),
            currentAsset:
              state.currentAsset?._id === id
                ? { ...state.currentAsset, ...assetUpdate }
                : state.currentAsset,
          })),
        removeAsset: (id) =>
          set((state) => ({
            assets: state.assets.filter((asset) => asset._id !== id),
            currentAsset:
              state.currentAsset?._id === id ? null : state.currentAsset,
          })),
        setAssetsPagination: (pagination) =>
          set({ assetsPagination: pagination }),

        // Settings Actions
        setSettings: (settings) => set({ settings }),
        setSettingsLoading: (loading) => set({ settingsLoading: loading }),
        updateSettings: (settingsUpdate) =>
          set((state) => ({
            settings: state.settings
              ? { ...state.settings, ...settingsUpdate }
              : null,
          })),

        // Dashboard Actions
        setDashboardData: (data) => set({ dashboardData: data }),
        setDashboardLoading: (loading) => set({ dashboardLoading: loading }),

        // UI Actions
        setSelectedTab: (tab) => set({ selectedTab: tab }),
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        // Utility Actions
        resetState: () => set(initialState),
        clearCurrentItems: () =>
          set({
            currentReport: null,
            currentTaxReport: null,
            currentExpense: null,
            currentAsset: null,
          }),
      }),
      {
        name: `${config.slug}-financials-store`,
        partialize: (state) => ({
          // Only persist certain parts of the state
          selectedTab: state.selectedTab,
          reportFilters: state.reportFilters,
          expenseFilters: state.expenseFilters,
          assetFilters: state.assetFilters,
        }),
      }
    ),
    {
      name: `${config.slug}-financials-store`,
    }
  )
);
