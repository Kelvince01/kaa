import type { AxiosResponse } from "axios";
import { httpClient } from "@/lib/axios";
import type {
  GetConnectionsResponse,
  LinkOAuthRequest,
  LinkOAuthResponse,
  SupportedOAuthProvider,
  UnlinkOAuthRequest,
  UnlinkOAuthResponse,
} from "./oauth.type";

export const oauthService = {
  /**
   * Get user's OAuth connections
   */
  getConnections: async (): Promise<GetConnectionsResponse> => {
    const response: AxiosResponse<GetConnectionsResponse> =
      await httpClient.api.get("/oauth/connections");
    return response.data;
  },

  /**
   * Link OAuth account to current user
   */
  linkAccount: async (data: LinkOAuthRequest): Promise<LinkOAuthResponse> => {
    const response: AxiosResponse<LinkOAuthResponse> =
      await httpClient.api.post("/oauth/link", data);
    return response.data;
  },

  /**
   * Unlink OAuth account from current user
   */
  unlinkAccount: async (
    data: UnlinkOAuthRequest
  ): Promise<UnlinkOAuthResponse> => {
    const response: AxiosResponse<UnlinkOAuthResponse> =
      await httpClient.api.post("/oauth/unlink", data);
    return response.data;
  },

  /**
   * Initiate Google OAuth flow
   */
  initiateGoogleOAuth: (): void => {
    window.location.href = `${httpClient.config.baseURL}/oauth/google`;
  },

  /**
   * Initiate Microsoft OAuth flow
   */
  initiateMicrosoftOAuth: (): void => {
    window.location.href = `${httpClient.config.baseURL}/oauth/microsoft`;
  },

  /**
   * Get OAuth provider configuration
   */
  getProviderConfig: (provider: SupportedOAuthProvider) => {
    const configs = {
      google: {
        name: "google",
        displayName: "Google",
        icon: "🔍",
        color: "#4285f4",
      },
      microsoft: {
        name: "microsoft",
        displayName: "Microsoft",
        icon: "🪟",
        color: "#00a1f1",
      },
    };

    return configs[provider];
  },

  /**
   * Check if provider is supported
   */
  isSupportedProvider: (provider: string): provider is SupportedOAuthProvider =>
    ["google", "microsoft"].includes(provider),
};
