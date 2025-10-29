/**
 * Review Store
 * Zustand store for review state management
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { ReviewFilterOptions, ReviewTab } from "./review.type";

type ReviewStore = {
  // Filters state
  filters: ReviewFilterOptions;
  setFilters: (filters: ReviewFilterOptions) => void;
  resetFilters: () => void;

  // Current tab
  activeTab: ReviewTab;
  setActiveTab: (tab: ReviewTab) => void;

  // Selected reviews (for bulk operations)
  selectedReviews: string[];
  setSelectedReviews: (ids: string[]) => void;
  addSelectedReview: (id: string) => void;
  removeSelectedReview: (id: string) => void;
  clearSelection: () => void;

  // UI state
  isCreatingReview: boolean;
  setIsCreatingReview: (isCreating: boolean) => void;
  editingReviewId: string | null;
  setEditingReviewId: (id: string | null) => void;
  viewingReviewId: string | null;
  setViewingReviewId: (id: string | null) => void;

  // Flag dialog state
  flaggingReviewId: string | null;
  setFlaggingReviewId: (id: string | null) => void;

  // Response dialog state
  respondingToReviewId: string | null;
  setRespondingToReviewId: (id: string | null) => void;

  // Moderation mode
  isModerationMode: boolean;
  setIsModerationMode: (isModeration: boolean) => void;
};

const initialFilters: ReviewFilterOptions = {
  page: 1,
  limit: 20,
  sortBy: "createdAt",
  sortOrder: "desc",
};

export const useReviewStore = create<ReviewStore>()(
  devtools(
    persist(
      (set) => ({
        // Filters
        filters: initialFilters,
        setFilters: (filters) => set({ filters }),
        resetFilters: () => set({ filters: initialFilters }),

        // Active tab
        activeTab: "all",
        setActiveTab: (tab) => set({ activeTab: tab }),

        // Selected reviews
        selectedReviews: [],
        setSelectedReviews: (ids) => set({ selectedReviews: ids }),
        addSelectedReview: (id) =>
          set((state) => ({
            selectedReviews: [...state.selectedReviews, id],
          })),
        removeSelectedReview: (id) =>
          set((state) => ({
            selectedReviews: state.selectedReviews.filter(
              (reviewId) => reviewId !== id
            ),
          })),
        clearSelection: () => set({ selectedReviews: [] }),

        // UI state
        isCreatingReview: false,
        setIsCreatingReview: (isCreating) =>
          set({ isCreatingReview: isCreating }),
        editingReviewId: null,
        setEditingReviewId: (id) => set({ editingReviewId: id }),
        viewingReviewId: null,
        setViewingReviewId: (id) => set({ viewingReviewId: id }),

        // Flag dialog
        flaggingReviewId: null,
        setFlaggingReviewId: (id) => set({ flaggingReviewId: id }),

        // Response dialog
        respondingToReviewId: null,
        setRespondingToReviewId: (id) => set({ respondingToReviewId: id }),

        // Moderation mode
        isModerationMode: false,
        setIsModerationMode: (isModeration) =>
          set({ isModerationMode: isModeration }),
      }),
      {
        name: "review-store",
        partialize: (state) => ({
          filters: state.filters,
          activeTab: state.activeTab,
        }),
      }
    ),
    { name: "ReviewStore" }
  )
);
