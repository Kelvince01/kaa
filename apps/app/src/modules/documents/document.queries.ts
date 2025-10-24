import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryClient } from "@/query/query-client";
import { documentService } from "./document.service";
import type {
  BulkDocumentOperation,
  DocumentCategory,
  DocumentFilter,
  DocumentPriority,
  DocumentUpdateInput,
  DocumentUploadInput,
} from "./document.type";

// Query keys
export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (filter?: DocumentFilter) => [...documentKeys.lists(), filter] as const,
  details: () => [...documentKeys.all, "detail"] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  verification: () => [...documentKeys.all, "verification"] as const,
  verificationStatus: () => [...documentKeys.verification(), "status"] as const,
  analytics: () => [...documentKeys.all, "analytics"] as const,
  categories: (category: DocumentCategory) =>
    [...documentKeys.all, "category", category] as const,
  search: (query: string) => [...documentKeys.all, "search", query] as const,
  versions: (id: string) => [...documentKeys.all, "versions", id] as const,
};

/**
 * Get user's document verification status
 */
export const useVerificationStatus = () => {
  return useQuery({
    queryKey: documentKeys.verificationStatus(),
    queryFn: documentService.getVerificationStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

/**
 * Get documents with filters and pagination
 */
export const useDocuments = (filter?: DocumentFilter) => {
  return useQuery({
    queryKey: documentKeys.list(filter),
    queryFn: () => documentService.getDocuments(filter),
    staleTime: 1000 * 30, // 30 seconds
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Infinite query for documents with pagination
 */
export const useInfiniteDocuments = (filter?: Omit<DocumentFilter, "page">) =>
  useInfiniteQuery({
    queryKey: [...documentKeys.lists(), "infinite", filter],
    queryFn: ({ pageParam = 1 }) =>
      documentService.getDocuments({ ...filter, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.hasNextPage) {
        return (lastPage.pagination.page || 1) + 1;
      }
      return;
    },
    staleTime: 1000 * 30,
  });

/**
 * Get documents by category
 */
export const useDocumentsByCategory = (category: DocumentCategory) => {
  return useQuery({
    queryKey: documentKeys.categories(category),
    queryFn: () => documentService.getDocumentsByCategory(category),
    staleTime: 1000 * 60, // 1 minute
  });
};

/**
 * Get a specific document by ID
 */
export const useDocument = (id: string, enabled = true) => {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => documentService.getDocument(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Get document versions
 */
export const useDocumentVersions = (id: string, enabled = true) => {
  return useQuery({
    queryKey: documentKeys.versions(id),
    queryFn: () => documentService.getDocumentVersions(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Get document analytics
 */
export const useDocumentAnalytics = (dateRange?: {
  from: string;
  to: string;
}) => {
  return useQuery({
    queryKey: [...documentKeys.analytics(), dateRange],
    queryFn: () => documentService.getAnalytics(dateRange),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Search documents
 */
export const useSearchDocuments = (
  query: string,
  options?: {
    categories?: DocumentCategory[];
    includeContent?: boolean;
    fuzzySearch?: boolean;
    limit?: number;
  }
) =>
  useQuery({
    queryKey: [...documentKeys.search(query), options],
    queryFn: () => documentService.searchDocuments(query, options),
    enabled: query.length > 0,
    staleTime: 1000 * 30,
  });

/**
 * Upload a new document
 */
export const useUploadDocument = () => {
  return useMutation({
    mutationFn: (input: DocumentUploadInput) =>
      documentService.uploadDocument(input),
    onSuccess: (_response, variables) => {
      toast.success("Document uploaded successfully");

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: documentKeys.verificationStatus(),
      });
      queryClient.invalidateQueries({
        queryKey: documentKeys.categories(variables.category),
      });
      queryClient.invalidateQueries({ queryKey: documentKeys.analytics() });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload document");
    },
  });
};

/**
 * Update a document
 */
export const useUpdateDocument = () => {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: DocumentUpdateInput }) =>
      documentService.updateDocument(id, input),
    onSuccess: (_response, { id }) => {
      toast.success("Document updated successfully");

      // Update cache
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentKeys.analytics() });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update document");
    },
  });
};

/**
 * Delete a document
 */
export const useDeleteDocument = () => {
  return useMutation({
    mutationFn: (id: string) => documentService.deleteDocument(id),
    onSuccess: (_response, id) => {
      toast.success("Document deleted successfully");

      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: documentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentKeys.analytics() });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete document");
    },
  });
};

/**
 * Verify a document
 */
export const useVerifyDocument = () => {
  return useMutation({
    mutationFn: ({
      id,
      priority,
    }: {
      id: string;
      priority?: DocumentPriority;
    }) => documentService.verifyDocument(id, priority),
    onSuccess: (_response, { id }) => {
      toast.success("Document verification started");

      // Invalidate document and verification status
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) });
      queryClient.invalidateQueries({
        queryKey: documentKeys.verificationStatus(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to start document verification");
    },
  });
};

/**
 * Bulk operations on documents
 */
export const useBulkDocumentOperation = () => {
  return useMutation({
    mutationFn: (operation: BulkDocumentOperation) =>
      documentService.bulkOperation(operation),
    onSuccess: (response, operation) => {
      toast.success(
        `Bulk operation completed: ${response.processed} documents processed`
      );

      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentKeys.analytics() });

      // If updating categories, invalidate category queries
      if (
        operation.operation === "update-category" &&
        operation.parameters?.category
      ) {
        queryClient.invalidateQueries({
          queryKey: documentKeys.categories(operation.parameters.category),
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Bulk operation failed");
    },
  });
};

/**
 * Share a document
 */
export const useShareDocument = () =>
  useMutation({
    mutationFn: ({
      id,
      settings,
    }: {
      id: string;
      settings: {
        isPublic?: boolean;
        allowDownload?: boolean;
        expiresAt?: string;
        passwordProtected?: boolean;
        password?: string;
      };
    }) => documentService.shareDocument(id, settings),
    onSuccess: (_response, { id }) => {
      toast.success("Document sharing settings updated");
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update sharing settings");
    },
  });

/**
 * Extract text from document
 */
export const useExtractText = () =>
  useMutation({
    mutationFn: (id: string) => documentService.extractText(id),
    onSuccess: (response) => {
      if (response.extractedText) {
        toast.success("Text extracted successfully");
      } else {
        toast.warning("No text could be extracted from this document");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to extract text");
    },
  });

/**
 * Create a new document version
 */
export const useCreateDocumentVersion = () => {
  return useMutation({
    mutationFn: ({
      id,
      file,
      changes,
    }: {
      id: string;
      file: File;
      changes?: string;
    }) => documentService.createVersion(id, file, changes),
    onSuccess: (_response, { id }) => {
      toast.success("New document version created");

      // Invalidate document and versions
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.versions(id) });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create new version");
    },
  });
};

/**
 * Download document
 */
export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: async ({ id, filename }: { id: string; filename?: string }) => {
      const blob = await documentService.downloadDocument(id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `document-${id}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    },
    onSuccess: () => {
      toast.success("Document download started");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to download document");
    },
  });
};

/**
 * Export documents
 */
export const useExportDocuments = () => {
  return useMutation({
    mutationFn: async ({
      format,
      filter,
      filename,
    }: {
      format: "csv" | "excel" | "pdf";
      filter?: DocumentFilter;
      filename?: string;
    }) => {
      const blob = await documentService.exportDocuments(format, filter);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        filename || `documents-export.${format === "excel" ? "xlsx" : format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { success: true };
    },
    onSuccess: () => {
      toast.success("Documents export started");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to export documents");
    },
  });
};

/**
 * Get verification job status
 */
export const useVerificationJobStatus = (jobId: string, enabled = true) => {
  return useQuery({
    queryKey: [...documentKeys.verification(), "job", jobId],
    queryFn: () => documentService.getVerificationJobStatus(jobId),
    enabled: enabled && !!jobId,
    refetchInterval: (data) => {
      // Stop polling if job is completed or failed
      // @ts-expect-error
      if (data?.status === "completed" || data?.status === "failed") {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    staleTime: 0, // Always fetch fresh data
  });
};
