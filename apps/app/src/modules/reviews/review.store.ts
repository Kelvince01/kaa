import { create } from "zustand";

type ReviewStore = {
  selectedReviews: string[];
  isReviewModalOpen: boolean;
  setSelectedReviews: (ids: string[]) => void;
  toggleReviewSelection: (id: string) => void;
  clearSelectedReviews: () => void;
  setReviewModalOpen: (isOpen: boolean) => void;
  hasSelectedReviews: () => boolean;
  selectedCount: () => number;
};

export const useReviewStore = create<ReviewStore>((set, get) => ({
  selectedReviews: [],
  isReviewModalOpen: false,

  setSelectedReviews: (ids: string[]) => {
    set({ selectedReviews: ids });
  },

  toggleReviewSelection: (id: string) => {
    set((state) => {
      const isSelected = state.selectedReviews.includes(id);
      const newSelected = isSelected
        ? state.selectedReviews.filter((i) => i !== id)
        : [...state.selectedReviews, id];
      return { selectedReviews: newSelected };
    });
  },

  clearSelectedReviews: () => {
    set({ selectedReviews: [] });
  },

  setReviewModalOpen: (isOpen: boolean) => {
    set({ isReviewModalOpen: isOpen });
  },

  hasSelectedReviews: () => get().selectedReviews.length > 0,

  selectedCount: () => get().selectedReviews.length,
}));
