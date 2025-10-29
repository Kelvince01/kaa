import type { AxiosResponse } from "axios";
import { httpClient } from "@/lib/axios";
import type { UploadParams } from "@/lib/imado/types";
import type { MeResponse } from "./me.type";

export const meService = {
  // Get current user
  getCurrentUser: async (): Promise<MeResponse> => {
    const response: AxiosResponse<MeResponse> =
      await httpClient.api.get<MeResponse>("/auth/me");
    return response.data;
  },

  /**
   * Fetch user context from backend
   */
  fetchUserContext: async (): Promise<MeResponse> => {
    const response: AxiosResponse<MeResponse> =
      await httpClient.api.get<MeResponse>("/auth/me");

    return response.data;
  },

  /**
   * Get upload token to securely upload files with imado
   *
   * @link https://imado.eu
   */
  getUploadToken: async (
    type: "organization" | "personal",
    query: UploadParams = { public: false, organizationId: undefined }
  ) => {
    const id = query.organizationId;

    if (!id && type === "organization")
      return console.error("Organization id required for organization uploads");

    if (id && type === "personal")
      return console.error("Personal uploads should be typed as personal");

    const preparedQuery = {
      public: String(query.public),
      organization: id,
    };

    const response = await httpClient.api.post("/auth/me/upload-token", {
      params: preparedQuery,
    });
    return response.data;
  },
};
