/**
 * Legal Document Service
 *
 * API service for legal document operations
 */

import type { LegalDocumentStatus } from "@kaa/models/types";
import { httpClient } from "@/lib/axios";
import type {
  DocumentVerificationResult,
  GenerateDocumentRequest,
  ILegalDocumentTemplate,
  LegalDocumentFilter,
  LegalDocumentListResponse,
  LegalDocumentResponse,
  SignDocumentRequest,
  TemplateFilter,
  TemplateListResponse,
  TemplateResponse,
} from "./legal-document.type";

const BASE_PATH = "/legal-documents";

/**
 * Legal document service
 */
export const legalDocumentService = {
  /**
   * Generate a new legal document
   */
  async generateDocument(
    request: GenerateDocumentRequest
  ): Promise<LegalDocumentResponse> {
    const { data } = await httpClient.api.post(
      `${BASE_PATH}/generate`,
      request
    );
    return data;
  },

  /**
   * Get a specific document
   */
  async getDocument(documentId: string): Promise<LegalDocumentResponse> {
    const { data } = await httpClient.api.get(`${BASE_PATH}/${documentId}`);
    return data;
  },

  /**
   * List documents with filters
   */
  async getDocuments(
    filter?: LegalDocumentFilter
  ): Promise<LegalDocumentListResponse> {
    const params = new URLSearchParams();

    if (filter) {
      if (filter.type) params.append("type", filter.type);
      if (filter.status) params.append("status", filter.status);
      if (filter.generatedBy) params.append("generatedBy", filter.generatedBy);
      if (filter.propertyId) params.append("propertyId", filter.propertyId);
      if (filter.tenantId) params.append("tenantId", filter.tenantId);
      if (filter.landlordId) params.append("landlordId", filter.landlordId);
      if (filter.startDate)
        params.append("startDate", filter.startDate.toISOString());
      if (filter.endDate)
        params.append("endDate", filter.endDate.toISOString());
      if (filter.page) params.append("page", filter.page.toString());
      if (filter.limit) params.append("limit", filter.limit.toString());
      if (filter.sortBy) params.append("sortBy", filter.sortBy);
      if (filter.sortOrder) params.append("sortOrder", filter.sortOrder);
    }

    const { data } = await httpClient.api.get(
      `${BASE_PATH}?${params.toString()}`
    );
    return data;
  },

  /**
   * Verify document authenticity
   */
  async verifyDocument(
    documentId: string,
    checksum: string
  ): Promise<DocumentVerificationResult> {
    const { data } = await httpClient.api.get(
      `${BASE_PATH}/verify/${documentId}?checksum=${checksum}`
    );
    return data;
  },

  /**
   * Sign a document
   */
  async signDocument(
    request: SignDocumentRequest
  ): Promise<LegalDocumentResponse> {
    const { documentId, ...body } = request;
    const { data } = await httpClient.api.post(
      `${BASE_PATH}/${documentId}/sign`,
      body
    );
    return data;
  },

  /**
   * Update document status
   */
  async updateDocumentStatus(
    documentId: string,
    status: LegalDocumentStatus
  ): Promise<LegalDocumentResponse> {
    const { data } = await httpClient.api.patch(
      `${BASE_PATH}/${documentId}/status`,
      { status }
    );
    return data;
  },

  /**
   * Archive a document
   */
  async archiveDocument(documentId: string): Promise<LegalDocumentResponse> {
    const { data } = await httpClient.api.post(
      `${BASE_PATH}/${documentId}/archive`
    );
    return data;
  },

  /**
   * Delete a document
   */
  async deleteDocument(
    documentId: string
  ): Promise<{ status: string; message: string }> {
    const { data } = await httpClient.api.delete(`${BASE_PATH}/${documentId}`);
    return data;
  },

  /**
   * Track document download
   */
  async trackDownload(
    documentId: string
  ): Promise<{ status: string; message: string }> {
    const { data } = await httpClient.api.post(
      `${BASE_PATH}/${documentId}/download/track`
    );
    return data;
  },

  downloadDocument: async (documentId: string): Promise<Blob> => {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
      const response = await fetch(
        `${baseUrl}${BASE_PATH}/${documentId}/download`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const contentType = response.headers.get("content-type");
      if (contentType !== "application/pdf") {
        throw new Error("Invalid response type: Expected a PDF");
      }

      if (!response.ok) {
        throw new Error("Failed to download document");
      }

      // Create a Blob from the response data
      const pdfBlob = await response.blob();

      return pdfBlob;
    } catch (error) {
      throw new Error(
        `Failed to download document: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },

  /**
   * Download document
   */
  async downloadDocument_v1(documentId: string): Promise<Blob> {
    const response = await httpClient.api.get(
      `${BASE_PATH}/${documentId}/download`,
      {
        responseType: "blob",
      }
    );
    console.log(response.data);
    return response.data;
  },

  // Template operations
  /**
   * Get all templates
   */
  async getTemplates(filter?: TemplateFilter): Promise<TemplateListResponse> {
    const params = new URLSearchParams();

    if (filter) {
      if (filter.type) params.append("type", filter.type);
      if (filter.status) params.append("status", filter.status);
      if (filter.jurisdiction)
        params.append("jurisdiction", filter.jurisdiction);
      if (filter.language) params.append("language", filter.language);
      if (filter.page) params.append("page", filter.page.toString());
      if (filter.limit) params.append("limit", filter.limit.toString());
    }

    const { data } = await httpClient.api.get(
      `${BASE_PATH}/templates?${params.toString()}`
    );
    return data;
  },

  /**
   * Get a specific template
   */
  async getTemplate(templateId: string): Promise<TemplateResponse> {
    const { data } = await httpClient.api.get(
      `${BASE_PATH}/templates/${templateId}`
    );
    return data;
  },

  /**
   * Create a new template (admin only)
   */
  async createTemplate(
    template: Partial<ILegalDocumentTemplate>
  ): Promise<TemplateResponse> {
    const { data } = await httpClient.api.post(
      `${BASE_PATH}/templates`,
      template
    );
    return data;
  },

  /**
   * Update a template (admin only)
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<ILegalDocumentTemplate>
  ): Promise<TemplateResponse> {
    const { data } = await httpClient.api.patch(
      `${BASE_PATH}/templates/${templateId}`,
      updates
    );
    return data;
  },

  /**
   * Delete a template (admin only)
   */
  async deleteTemplate(
    templateId: string
  ): Promise<{ status: string; message: string }> {
    const { data } = await httpClient.api.delete(
      `${BASE_PATH}/templates/${templateId}`
    );
    return data;
  },
};
