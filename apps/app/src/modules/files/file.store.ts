import { create } from "zustand";
import type { FileCategory, FileStatus } from "./file.type";

// Add FileStatus type since it was referenced in store but missing from types
// export type FileStatus =
//   | "active"
//   | "archived"
//   | "deleted"
//   | "processing"
//   | "failed";

type FileStore = {
  selectedFiles: string[];
  isFileModalOpen: boolean;
  isUploadModalOpen: boolean;
  uploadProgress: Record<string, number>;
  viewMode: "grid" | "list";
  filterCategory: FileCategory | null;
  filterStatus: FileStatus | null;
  searchQuery: string;

  // Selection methods
  setSelectedFiles: (ids: string[]) => void;
  toggleFileSelection: (id: string) => void;
  clearSelectedFiles: () => void;
  hasSelectedFiles: () => boolean;
  selectedCount: () => number;

  // Modal methods
  setFileModalOpen: (isOpen: boolean) => void;
  setUploadModalOpen: (isOpen: boolean) => void;

  // Upload progress methods
  setUploadProgress: (fileId: string, progress: number) => void;
  clearUploadProgress: (fileId: string) => void;
  clearAllUploadProgress: () => void;

  // View methods
  setViewMode: (mode: "grid" | "list") => void;

  // Filter methods
  setFilterCategory: (category: FileCategory | null) => void;
  setFilterStatus: (status: FileStatus | null) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
};

export const useFileStore = create<FileStore>((set, get) => ({
  selectedFiles: [],
  isFileModalOpen: false,
  isUploadModalOpen: false,
  uploadProgress: {},
  viewMode: "grid",
  filterCategory: null,
  filterStatus: null,
  searchQuery: "",

  // Selection methods
  setSelectedFiles: (ids: string[]) => {
    set({ selectedFiles: ids });
  },

  toggleFileSelection: (id: string) => {
    set((state) => {
      const isSelected = state.selectedFiles.includes(id);
      const newSelected = isSelected
        ? state.selectedFiles.filter((i) => i !== id)
        : [...state.selectedFiles, id];
      return { selectedFiles: newSelected };
    });
  },

  clearSelectedFiles: () => {
    set({ selectedFiles: [] });
  },

  hasSelectedFiles: () => {
    return get().selectedFiles.length > 0;
  },

  selectedCount: () => {
    return get().selectedFiles.length;
  },

  // Modal methods
  setFileModalOpen: (isOpen: boolean) => {
    set({ isFileModalOpen: isOpen });
  },

  setUploadModalOpen: (isOpen: boolean) => {
    set({ isUploadModalOpen: isOpen });
  },

  // Upload progress methods
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

  // View methods
  setViewMode: (mode: "grid" | "list") => {
    set({ viewMode: mode });
  },

  // Filter methods
  setFilterCategory: (category: FileCategory | null) => {
    set({ filterCategory: category });
  },

  setFilterStatus: (status: FileStatus | null) => {
    set({ filterStatus: status });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  clearFilters: () => {
    set({
      filterCategory: null,
      filterStatus: null,
      searchQuery: "",
    });
  },
}));
