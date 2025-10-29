/**
 * Legal Document Store
 *
 * Zustand store for legal document state management
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  ILegalDocument,
  ILegalDocumentTemplate,
  LegalDocumentFilter,
  TemplateFilter,
} from "./legal-document.type";

type LegalDocumentStore = {
  // Current document being viewed/edited
  currentDocument: ILegalDocument | null;

  // Current template being used
  currentTemplate: ILegalDocumentTemplate | null;

  // Filter state
  documentFilter: LegalDocumentFilter;
  templateFilter: TemplateFilter;

  // UI state
  isGenerateModalOpen: boolean;
  isViewerModalOpen: boolean;
  isSigningModalOpen: boolean;
  isTemplateEditorOpen: boolean;

  // Selected documents for bulk operations
  selectedDocuments: string[];

  // Recent documents
  recentDocuments: string[];

  // Favorites
  favoriteDocuments: string[];

  // Search
  searchQuery: string;

  // Actions - Document management
  setCurrentDocument: (document: ILegalDocument | null) => void;
  setCurrentTemplate: (template: ILegalDocumentTemplate | null) => void;

  // Actions - Filters
  setDocumentFilter: (filter: Partial<LegalDocumentFilter>) => void;
  clearDocumentFilter: () => void;
  setTemplateFilter: (filter: Partial<TemplateFilter>) => void;
  clearTemplateFilter: () => void;

  // Actions - Modals
  setGenerateModalOpen: (isOpen: boolean) => void;
  setViewerModalOpen: (isOpen: boolean) => void;
  setSigningModalOpen: (isOpen: boolean) => void;
  setTemplateEditorOpen: (isOpen: boolean) => void;

  // Actions - Selection
  toggleDocumentSelection: (id: string) => void;
  clearSelection: () => void;
  selectAll: (documentIds: string[]) => void;

  // Actions - Recent & Favorites
  addToRecent: (id: string) => void;
  clearRecent: () => void;
  toggleFavorite: (id: string) => void;

  // Actions - Search
  setSearchQuery: (query: string) => void;

  // Computed
  hasSelection: () => boolean;
  selectionCount: () => number;
  isFavorite: (id: string) => boolean;
};

const initialDocumentFilter: LegalDocumentFilter = {
  page: 1,
  limit: 20,
  sortBy: "createdAt",
  sortOrder: "desc",
};

const initialTemplateFilter: TemplateFilter = {
  page: 1,
  limit: 20,
};

export const useLegalDocumentStore = create<LegalDocumentStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentDocument: null,
      currentTemplate: null,
      documentFilter: initialDocumentFilter,
      templateFilter: initialTemplateFilter,
      isGenerateModalOpen: false,
      isViewerModalOpen: false,
      isSigningModalOpen: false,
      isTemplateEditorOpen: false,
      selectedDocuments: [],
      recentDocuments: [],
      favoriteDocuments: [],
      searchQuery: "",

      // Document management
      setCurrentDocument: (document) => set({ currentDocument: document }),
      setCurrentTemplate: (template) => set({ currentTemplate: template }),

      // Filters
      setDocumentFilter: (filter) =>
        set((state) => ({
          documentFilter: { ...state.documentFilter, ...filter },
        })),
      clearDocumentFilter: () => set({ documentFilter: initialDocumentFilter }),
      setTemplateFilter: (filter) =>
        set((state) => ({
          templateFilter: { ...state.templateFilter, ...filter },
        })),
      clearTemplateFilter: () => set({ templateFilter: initialTemplateFilter }),

      // Modals
      setGenerateModalOpen: (isOpen) => set({ isGenerateModalOpen: isOpen }),
      setViewerModalOpen: (isOpen) => set({ isViewerModalOpen: isOpen }),
      setSigningModalOpen: (isOpen) => set({ isSigningModalOpen: isOpen }),
      setTemplateEditorOpen: (isOpen) => set({ isTemplateEditorOpen: isOpen }),

      // Selection
      toggleDocumentSelection: (id) =>
        set((state) => ({
          selectedDocuments: state.selectedDocuments.includes(id)
            ? state.selectedDocuments.filter((docId) => docId !== id)
            : [...state.selectedDocuments, id],
        })),
      clearSelection: () => set({ selectedDocuments: [] }),
      selectAll: (documentIds) => set({ selectedDocuments: documentIds }),

      // Recent & Favorites
      addToRecent: (id) =>
        set((state) => {
          const recent = [
            id,
            ...state.recentDocuments.filter((docId) => docId !== id),
          ];
          return { recentDocuments: recent.slice(0, 10) }; // Keep only last 10
        }),
      clearRecent: () => set({ recentDocuments: [] }),
      toggleFavorite: (id) =>
        set((state) => ({
          favoriteDocuments: state.favoriteDocuments.includes(id)
            ? state.favoriteDocuments.filter((docId) => docId !== id)
            : [...state.favoriteDocuments, id],
        })),

      // Search
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Computed
      hasSelection: () => get().selectedDocuments.length > 0,
      selectionCount: () => get().selectedDocuments.length,
      isFavorite: (id) => get().favoriteDocuments.includes(id),
    }),
    {
      name: "legal-document-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        recentDocuments: state.recentDocuments,
        favoriteDocuments: state.favoriteDocuments,
        documentFilter: state.documentFilter,
        templateFilter: state.templateFilter,
      }),
    }
  )
);
