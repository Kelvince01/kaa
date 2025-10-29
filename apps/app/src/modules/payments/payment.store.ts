import { create } from "zustand";

type PaymentStore = {
  selectedPayments: string[];
  isPaymentModalOpen: boolean;
  isProcessPaymentModalOpen: boolean;
  isRefundModalOpen: boolean;
  activePaymentId: string | null;
  filterStatus: string | null;
  filterType: string | null;

  // Selection methods
  setSelectedPayments: (ids: string[]) => void;
  togglePaymentSelection: (id: string) => void;
  clearSelectedPayments: () => void;
  hasSelectedPayments: () => boolean;
  selectedCount: () => number;

  // Modal methods
  setPaymentModalOpen: (isOpen: boolean) => void;
  setProcessPaymentModalOpen: (isOpen: boolean) => void;
  setRefundModalOpen: (isOpen: boolean) => void;

  // Active payment methods
  setActivePayment: (id: string | null) => void;
  clearActivePayment: () => void;

  // Filter methods
  setFilterStatus: (status: string | null) => void;
  setFilterType: (type: string | null) => void;
  clearFilters: () => void;
};

export const usePaymentStore = create<PaymentStore>((set, get) => ({
  selectedPayments: [],
  isPaymentModalOpen: false,
  isProcessPaymentModalOpen: false,
  isRefundModalOpen: false,
  activePaymentId: null,
  filterStatus: null,
  filterType: null,

  // Selection methods
  setSelectedPayments: (ids: string[]) => {
    set({ selectedPayments: ids });
  },

  togglePaymentSelection: (id: string) => {
    set((state) => {
      const isSelected = state.selectedPayments.includes(id);
      const newSelected = isSelected
        ? state.selectedPayments.filter((i) => i !== id)
        : [...state.selectedPayments, id];
      return { selectedPayments: newSelected };
    });
  },

  clearSelectedPayments: () => {
    set({ selectedPayments: [] });
  },

  hasSelectedPayments: () => get().selectedPayments.length > 0,

  selectedCount: () => get().selectedPayments.length,

  // Modal methods
  setPaymentModalOpen: (isOpen: boolean) => {
    set({ isPaymentModalOpen: isOpen });
  },

  setProcessPaymentModalOpen: (isOpen: boolean) => {
    set({ isProcessPaymentModalOpen: isOpen });
  },

  setRefundModalOpen: (isOpen: boolean) => {
    set({ isRefundModalOpen: isOpen });
  },

  // Active payment methods
  setActivePayment: (id: string | null) => {
    set({ activePaymentId: id });
  },

  clearActivePayment: () => {
    set({ activePaymentId: null });
  },

  // Filter methods
  setFilterStatus: (status: string | null) => {
    set({ filterStatus: status });
  },

  setFilterType: (type: string | null) => {
    set({ filterType: type });
  },

  clearFilters: () => {
    set({ filterStatus: null, filterType: null });
  },
}));
