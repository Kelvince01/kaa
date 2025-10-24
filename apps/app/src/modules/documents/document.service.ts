import { httpClient } from "@/lib/axios";
import {
  type BulkDocumentOperation,
  type DocumentAnalytics,
  type DocumentCategory,
  type DocumentFilter,
  type DocumentListResponse,
  DocumentPriority,
  type DocumentResponse,
  type DocumentUpdateInput,
  type DocumentUploadInput,
  type DocumentUploadResponse,
  type IDocument,
  type VerificationStatusResponse,
} from "./document.type";

const DOCUMENTS_API = "/documents";

/**
 * Document service for API communication
 */

// biome-ignore lint/complexity/noStaticOnlyClass: ignore
export class DocumentService {
  /**
   * Get user's verification status
   */
  static async getVerificationStatus(): Promise<VerificationStatusResponse> {
    const { data } = await httpClient.api.get(
      `${DOCUMENTS_API}/verification/status`
    );
    return data;
  }

  /**
   * Upload a new document
   */
  static async uploadDocument(
    input: DocumentUploadInput
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append("file", input.file);
    formData.append("category", input.category);

    if (input.name) formData.append("name", input.name);
    if (input.expiryDate) formData.append("expiryDate", input.expiryDate);
    if (input.description) formData.append("description", input.description);
    if (input.tags) {
      for (const tag of input.tags) {
        formData.append("tags[]", tag);
      }
    }
    if (input.priority) formData.append("priority", input.priority.toString());
    if (input.autoVerify !== undefined)
      formData.append("autoVerify", input.autoVerify.toString());

    const { data } = await httpClient.api.post(
      `${DOCUMENTS_API}/verification`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            // Emit progress event if needed
            window.dispatchEvent(
              new CustomEvent("document-upload-progress", { detail: progress })
            );
          }
        },
      }
    );
    return data;
  }

  /**
   * Get documents list with filters
   */
  static async getDocuments(
    filter?: DocumentFilter
  ): Promise<DocumentListResponse> {
    const params = new URLSearchParams();

    if (filter) {
      if (filter.category?.length) {
        for (const cat of filter.category) {
          params.append("category", cat);
        }
      }
      if (filter.status?.length) {
        for (const status of filter.status) {
          params.append("status", status);
        }
      }
      if (filter.search) params.append("search", filter.search);
      if (filter.uploadedFrom)
        params.append("uploadedFrom", filter.uploadedFrom);
      if (filter.uploadedTo) params.append("uploadedTo", filter.uploadedTo);
      if (filter.expiryFrom) params.append("expiryFrom", filter.expiryFrom);
      if (filter.expiryTo) params.append("expiryTo", filter.expiryTo);
      if (filter.tags?.length) {
        for (const tag of filter.tags) {
          params.append("tags", tag);
        }
      }
      if (filter.page) params.append("page", filter.page.toString());
      if (filter.limit) params.append("limit", filter.limit.toString());
      if (filter.sortBy) params.append("sortBy", filter.sortBy);
      if (filter.sortOrder) params.append("sortOrder", filter.sortOrder);
    }

    const { data } = await httpClient.api.get(
      `${DOCUMENTS_API}?${params.toString()}`
    );
    return data;
  }

  /**
   * Get documents by category
   */
  static async getDocumentsByCategory(
    category: DocumentCategory
  ): Promise<DocumentListResponse> {
    const { data } = await httpClient.api.get(`${DOCUMENTS_API}`, {
      params: { category },
    });
    return data;
  }

  /**
   * Get a specific document by ID
   */
  static async getDocument(id: string): Promise<DocumentResponse> {
    const { data } = await httpClient.api.get(`${DOCUMENTS_API}/${id}`);
    return data;
  }

  /**
   * Update a document
   */
  static async updateDocument(
    id: string,
    input: DocumentUpdateInput
  ): Promise<DocumentResponse> {
    const { data } = await httpClient.api.patch(
      `${DOCUMENTS_API}/${id}`,
      input
    );
    return data;
  }

  /**
   * Delete a document
   */
  static async deleteDocument(
    id: string
  ): Promise<{ status: string; message?: string }> {
    const { data } = await httpClient.api.delete(`${DOCUMENTS_API}/${id}`);
    return data;
  }

  /**
   * Download a document
   */
  static async downloadDocument(id: string): Promise<Blob> {
    const response = await httpClient.api.get(
      `${DOCUMENTS_API}/${id}/download`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  }

  /**
   * Get document preview/thumbnail
   */
  static async getDocumentPreview(id: string): Promise<string> {
    const response = await httpClient.api.get(`${DOCUMENTS_API}/${id}/preview`);
    return response.data.previewUrl;
  }

  /**
   * Verify a document manually
   */
  static async verifyDocument(
    id: string,
    priority: DocumentPriority = DocumentPriority.NORMAL
  ): Promise<{ status: string; jobId: string; message?: string }> {
    const { data } = await httpClient.api.post(
      `${DOCUMENTS_API}/${id}/verify`,
      { priority }
    );
    return data;
  }

  /**
   * Get verification job status
   */
  static async getVerificationJobStatus(jobId: string): Promise<{
    status: string;
    progress: number;
    result?: unknown;
  }> {
    const { data } = await httpClient.api.get(
      `${DOCUMENTS_API}/verification/job/${jobId}`
    );
    return data;
  }

  /**
   * Bulk operations on documents
   */
  static async bulkOperation(operation: BulkDocumentOperation): Promise<{
    status: string;
    processed: number;
    failed: number;
    message?: string;
  }> {
    const { data } = await httpClient.api.post(
      `${DOCUMENTS_API}/bulk`,
      operation
    );
    return data;
  }

  /**
   * Share a document
   */
  static async shareDocument(
    id: string,
    settings: {
      isPublic?: boolean;
      allowDownload?: boolean;
      expiresAt?: string;
      passwordProtected?: boolean;
      password?: string;
    }
  ): Promise<{ status: string; shareLink?: string; message?: string }> {
    const { data } = await httpClient.api.post(
      `${DOCUMENTS_API}/${id}/share`,
      settings
    );
    return data;
  }

  /**
   * Get document analytics
   */
  static async getAnalytics(dateRange?: {
    from: string;
    to: string;
  }): Promise<{ status: string; data?: DocumentAnalytics; message?: string }> {
    const params = dateRange
      ? {
          from: dateRange.from,
          to: dateRange.to,
        }
      : undefined;

    const { data } = await httpClient.api.get(`${DOCUMENTS_API}/analytics`, {
      params,
    });
    return data;
  }

  /**
   * Extract text from document using OCR
   */
  static async extractText(id: string): Promise<{
    status: string;
    extractedText?: string;
    confidence?: number;
    message?: string;
  }> {
    const { data } = await httpClient.api.post(
      `${DOCUMENTS_API}/${id}/extract-text`
    );
    return data;
  }

  /**
   * Get document versions
   */
  static async getDocumentVersions(id: string): Promise<{
    status: string;
    versions?: Array<{
      version: number;
      uploadedAt: string;
      uploadedBy: string;
      changes?: string;
      isActive: boolean;
    }>;
    message?: string;
  }> {
    const { data } = await httpClient.api.get(
      `${DOCUMENTS_API}/${id}/versions`
    );
    return data;
  }

  /**
   * Create a new document version
   */
  static async createVersion(
    id: string,
    file: File,
    changes?: string
  ): Promise<DocumentResponse> {
    const formData = new FormData();
    formData.append("file", file);
    if (changes) formData.append("changes", changes);

    const { data } = await httpClient.api.post(
      `${DOCUMENTS_API}/${id}/versions`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data;
  }

  /**
   * Export documents
   */
  static async exportDocuments(
    format: "csv" | "excel" | "pdf",
    filter?: DocumentFilter
  ): Promise<Blob> {
    const params = new URLSearchParams({ format });

    if (filter) {
      for (const [key, value] of Object.entries(filter)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            for (const v of value) {
              params.append(`${key}[]`, v.toString());
            }
          } else {
            params.append(key, value.toString());
          }
        }
      }
    }

    const response = await httpClient.api.get(
      `${DOCUMENTS_API}/export?${params.toString()}`,
      {
        responseType: "blob",
      }
    );
    return response.data;
  }

  /**
   * Search documents with advanced filters
   */
  static async searchDocuments(
    query: string,
    options?: {
      categories?: DocumentCategory[];
      includeContent?: boolean;
      fuzzySearch?: boolean;
      limit?: number;
    }
  ): Promise<{
    status: string;
    results?: Array<{
      document: IDocument;
      score: number;
      highlights: string[];
    }>;
    total?: number;
    message?: string;
  }> {
    const { data } = await httpClient.api.post(`${DOCUMENTS_API}/search`, {
      query,
      ...options,
    });
    return data;
  }
}

// Export default instance
export const documentService = DocumentService;
