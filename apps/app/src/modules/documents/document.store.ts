import { config } from "@kaa/config";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DocumentFilter, IDocument } from "./document.type";

type DocumentStore = {
  // Selected documents for bulk operations
  selectedDocuments: string[];

  // Current filter state
  filter: DocumentFilter;

  // View preferences
  viewMode: "grid" | "list" | "table";
  itemsPerPage: number;

  // Upload progress tracking
  uploadProgress: Record<string, number>;

  // Modal states
  isUploadModalOpen: boolean;
  isViewerModalOpen: boolean;
  isBulkActionsModalOpen: boolean;

  // Currently viewed document
  currentDocument: IDocument | null;

  // Search state
  searchQuery: string;
  searchResults: IDocument[];

  // Favorites
  favoriteDocuments: string[];

  // Recent documents
  recentDocuments: string[];

  // Actions
  setSelectedDocuments: (ids: string[]) => void;
  toggleDocumentSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: (documentIds: string[]) => void;

  setFilter: (filter: Partial<DocumentFilter>) => void;
  clearFilter: () => void;

  setViewMode: (mode: "grid" | "list" | "table") => void;
  setItemsPerPage: (count: number) => void;

  setUploadProgress: (fileId: string, progress: number) => void;
  clearUploadProgress: (fileId: string) => void;
  clearAllUploadProgress: () => void;

  setUploadModalOpen: (isOpen: boolean) => void;
  setViewerModalOpen: (isOpen: boolean) => void;
  setBulkActionsModalOpen: (isOpen: boolean) => void;

  setCurrentDocument: (document: IDocument | null) => void;

  setSearchQuery: (query: string) => void;
  setSearchResults: (results: IDocument[]) => void;

  addToFavorites: (id: string) => void;
  removeFromFavorites: (id: string) => void;
  toggleFavorite: (id: string) => void;

  addToRecent: (id: string) => void;
  clearRecent: () => void;

  // Computed getters
  hasSelection: () => boolean;
  selectionCount: () => number;
  isFavorite: (id: string) => boolean;
};

const initialFilter: DocumentFilter = {
  category: undefined,
  status: undefined,
  search: undefined,
  uploadedFrom: undefined,
  uploadedTo: undefined,
  expiryFrom: undefined,
  expiryTo: undefined,
  tags: undefined,
  page: 1,
  limit: 20,
  sortBy: "uploadedAt",
  sortOrder: "desc",
};

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedDocuments: [],
      filter: initialFilter,
      viewMode: "grid",
      itemsPerPage: 20,
      uploadProgress: {},
      isUploadModalOpen: false,
      isViewerModalOpen: false,
      isBulkActionsModalOpen: false,
      currentDocument: null,
      searchQuery: "",
      searchResults: [],
      favoriteDocuments: [],
      recentDocuments: [],

      // Selection actions
      setSelectedDocuments: (ids: string[]) => {
        set({ selectedDocuments: ids });
      },

      toggleDocumentSelection: (id: string) => {
        set((state) => {
          const isSelected = state.selectedDocuments.includes(id);
          if (isSelected) {
            return {
              selectedDocuments: state.selectedDocuments.filter(
                (docId) => docId !== id
              ),
            };
          }
          return {
            selectedDocuments: [...state.selectedDocuments, id],
          };
        });
      },

      clearSelection: () => {
        set({ selectedDocuments: [] });
      },

      selectAll: (documentIds: string[]) => {
        set({ selectedDocuments: documentIds });
      },

      // Filter actions
      setFilter: (newFilter: Partial<DocumentFilter>) => {
        set((state) => ({
          filter: { ...state.filter, ...newFilter },
        }));
      },

      clearFilter: () => {
        set({ filter: initialFilter });
      },

      // View actions
      setViewMode: (mode: "grid" | "list" | "table") => {
        set({ viewMode: mode });
      },

      setItemsPerPage: (count: number) => {
        set((state) => ({
          itemsPerPage: count,
          filter: { ...state.filter, limit: count },
        }));
      },

      // Upload progress actions
      setUploadProgress: (fileId: string, progress: number) => {
        set((state) => ({
          uploadProgress: {
            ...state.uploadProgress,
            [fileId]: progress,
          },
        }));
      },

      clearUploadProgress: (fileId: string) => {
        set((state) => {
          const newProgress = { ...state.uploadProgress };
          delete newProgress[fileId];
          return { uploadProgress: newProgress };
        });
      },

      clearAllUploadProgress: () => {
        set({ uploadProgress: {} });
      },

      // Modal actions
      setUploadModalOpen: (isOpen: boolean) => {
        set({ isUploadModalOpen: isOpen });
      },

      setViewerModalOpen: (isOpen: boolean) => {
        set({ isViewerModalOpen: isOpen });
      },

      setBulkActionsModalOpen: (isOpen: boolean) => {
        set({ isBulkActionsModalOpen: isOpen });
      },

      // Current document actions
      setCurrentDocument: (document: IDocument | null) => {
        set({ currentDocument: document });

        // Add to recent if document is set
        if (document) {
          get().addToRecent(document._id);
        }
      },

      // Search actions
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      setSearchResults: (results: IDocument[]) => {
        set({ searchResults: results });
      },

      // Favorites actions
      addToFavorites: (id: string) => {
        set((state) => {
          if (!state.favoriteDocuments.includes(id)) {
            return {
              favoriteDocuments: [...state.favoriteDocuments, id],
            };
          }
          return state;
        });
      },

      removeFromFavorites: (id: string) => {
        set((state) => ({
          favoriteDocuments: state.favoriteDocuments.filter(
            (docId) => docId !== id
          ),
        }));
      },

      toggleFavorite: (id: string) => {
        const state = get();
        if (state.favoriteDocuments.includes(id)) {
          state.removeFromFavorites(id);
        } else {
          state.addToFavorites(id);
        }
      },

      // Recent documents actions
      addToRecent: (id: string) => {
        set((state) => {
          const filtered = state.recentDocuments.filter(
            (docId) => docId !== id
          );
          return {
            recentDocuments: [id, ...filtered].slice(0, 10), // Keep only last 10
          };
        });
      },

      clearRecent: () => {
        set({ recentDocuments: [] });
      },

      // Computed getters
      hasSelection: () => get().selectedDocuments.length > 0,

      selectionCount: () => get().selectedDocuments.length,

      isFavorite: (id: string) => get().favoriteDocuments.includes(id),
    }),
    {
      name: `${config.slug}-document-store`,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist user preferences, not temporary state
        viewMode: state.viewMode,
        itemsPerPage: state.itemsPerPage,
        favoriteDocuments: state.favoriteDocuments,
        recentDocuments: state.recentDocuments,
      }),
    }
  )
);
