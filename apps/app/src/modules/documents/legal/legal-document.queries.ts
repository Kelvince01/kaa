/**
 * Legal Document Queries
 *
 * React Query hooks for legal documents
 */

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryClient } from "@/query/query-client";
import { legalDocumentService } from "./legal-document.service";
import type {
  GenerateDocumentRequest,
  LegalDocumentFilter,
  LegalDocumentStatus,
  SignDocumentRequest,
  TemplateFilter,
} from "./legal-document.type";

// Query keys
export const legalDocumentKeys = {
  all: ["legal-documents"] as const,
  lists: () => [...legalDocumentKeys.all, "list"] as const,
  list: (filter?: LegalDocumentFilter) =>
    [...legalDocumentKeys.lists(), filter] as const,
  details: () => [...legalDocumentKeys.all, "detail"] as const,
  detail: (id: string) => [...legalDocumentKeys.details(), id] as const,
  templates: () => [...legalDocumentKeys.all, "templates"] as const,
  templatesList: (filter?: TemplateFilter) =>
    [...legalDocumentKeys.templates(), "list", filter] as const,
  template: (id: string) =>
    [...legalDocumentKeys.templates(), "detail", id] as const,
};

/**
 * Get legal documents with filters
 */
export const useLegalDocuments = (filter?: LegalDocumentFilter) =>
  useQuery({
    queryKey: legalDocumentKeys.list(filter),
    queryFn: () => legalDocumentService.getDocuments(filter),
    staleTime: 1000 * 60, // 1 minute
  });

/**
 * Get a specific legal document
 */
export const useLegalDocument = (id: string, enabled = true) =>
  useQuery({
    queryKey: legalDocumentKeys.detail(id),
    queryFn: () => legalDocumentService.getDocument(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

/**
 * Generate a new legal document
 */
export const useGenerateDocument = () => {
  return useMutation({
    mutationFn: (request: GenerateDocumentRequest) =>
      legalDocumentService.generateDocument(request),
    onSuccess: (response) => {
      toast.success("Document generated successfully");

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: legalDocumentKeys.lists() });

      // Update template usage count
      if (response.document?.templateId) {
        queryClient.invalidateQueries({
          queryKey: legalDocumentKeys.template(response.document.templateId),
        });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate document");
    },
  });
};

/**
 * Verify document authenticity
 */
export const useVerifyDocument = () =>
  useMutation({
    mutationFn: ({
      documentId,
      checksum,
    }: {
      documentId: string;
      checksum: string;
    }) => legalDocumentService.verifyDocument(documentId, checksum),
    onSuccess: (result) => {
      if (result.valid) {
        toast.success("Document verified successfully");
      } else {
        toast.error(result.message || "Document verification failed");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to verify document");
    },
  });

/**
 * Sign a document
 */
export const useSignDocument = () => {
  return useMutation({
    mutationFn: (request: SignDocumentRequest) =>
      legalDocumentService.signDocument(request),
    onSuccess: (_response, variables) => {
      toast.success("Document signed successfully");

      // Update document cache
      queryClient.invalidateQueries({
        queryKey: legalDocumentKeys.detail(variables.documentId),
      });
      queryClient.invalidateQueries({ queryKey: legalDocumentKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to sign document");
    },
  });
};

/**
 * Update document status
 */
export const useUpdateDocumentStatus = () =>
  useMutation({
    mutationFn: ({
      documentId,
      status,
    }: {
      documentId: string;
      status: LegalDocumentStatus;
    }) => legalDocumentService.updateDocumentStatus(documentId, status),
    onSuccess: (_response, { documentId }) => {
      toast.success("Document status updated");

      queryClient.invalidateQueries({
        queryKey: legalDocumentKeys.detail(documentId),
      });
      queryClient.invalidateQueries({ queryKey: legalDocumentKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update document status");
    },
  });

/**
 * Archive a document
 */
export const useArchiveDocument = () =>
  useMutation({
    mutationFn: (documentId: string) =>
      legalDocumentService.archiveDocument(documentId),
    onSuccess: (_response, documentId) => {
      toast.success("Document archived successfully");

      queryClient.invalidateQueries({
        queryKey: legalDocumentKeys.detail(documentId),
      });
      queryClient.invalidateQueries({ queryKey: legalDocumentKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to archive document");
    },
  });

/**
 * Delete a document
 */
export const useDeleteDocument = () =>
  useMutation({
    mutationFn: (documentId: string) =>
      legalDocumentService.deleteDocument(documentId),
    onSuccess: (_response, documentId) => {
      toast.success("Document deleted successfully");

      queryClient.removeQueries({
        queryKey: legalDocumentKeys.detail(documentId),
      });
      queryClient.invalidateQueries({ queryKey: legalDocumentKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete document");
    },
  });

/**
 * Download a document
 */
export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: async ({
      documentId,
      filename,
    }: {
      documentId: string;
      filename?: string;
    }) => {
      // Track download
      await legalDocumentService.trackDownload(documentId);

      // Download document
      const blob = await legalDocumentService.downloadDocument(documentId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `legal-document-${documentId}.pdf`;
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

// Template queries

/**
 * Get templates with filters
 */
export const useTemplates = (filter?: TemplateFilter) =>
  useQuery({
    queryKey: legalDocumentKeys.templatesList(filter),
    queryFn: () => legalDocumentService.getTemplates(filter),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

/**
 * Get a specific template
 */
export const useTemplate = (id: string, enabled = true) =>
  useQuery({
    queryKey: legalDocumentKeys.template(id),
    queryFn: () => legalDocumentService.getTemplate(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

/**
 * Create a new template (admin only)
 */
export const useCreateTemplate = () =>
  useMutation({
    mutationFn: legalDocumentService.createTemplate,
    onSuccess: () => {
      toast.success("Template created successfully");
      queryClient.invalidateQueries({
        queryKey: legalDocumentKeys.templates(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create template");
    },
  });

/**
 * Update a template (admin only)
 */
export const useUpdateTemplate = () =>
  useMutation({
    mutationFn: ({
      templateId,
      updates,
    }: {
      templateId: string;
      updates: any;
    }) => legalDocumentService.updateTemplate(templateId, updates),
    onSuccess: (_response, { templateId }) => {
      toast.success("Template updated successfully");
      queryClient.invalidateQueries({
        queryKey: legalDocumentKeys.template(templateId),
      });
      queryClient.invalidateQueries({
        queryKey: legalDocumentKeys.templates(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update template");
    },
  });

/**
 * Delete a template (admin only)
 */
export const useDeleteTemplate = () =>
  useMutation({
    mutationFn: (templateId: string) =>
      legalDocumentService.deleteTemplate(templateId),
    onSuccess: (_response, templateId) => {
      toast.success("Template deleted successfully");
      queryClient.removeQueries({
        queryKey: legalDocumentKeys.template(templateId),
      });
      queryClient.invalidateQueries({
        queryKey: legalDocumentKeys.templates(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete template");
    },
  });
