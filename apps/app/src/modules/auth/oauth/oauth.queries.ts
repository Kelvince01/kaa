import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { oauthService } from "./oauth.service";
import type { OAuthProvider, SupportedOAuthProvider } from "./oauth.type";

// Query Keys
export const oauthKeys = {
  all: ["oauth"] as const,
  connections: () => [...oauthKeys.all, "connections"] as const,
};

/**
 * Hook to get user's OAuth connections
 */
export const useOAuthConnections = () => {
  return useQuery({
    queryKey: oauthKeys.connections(),
    queryFn: oauthService.getConnections,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to link OAuth account
 */
export const useLinkOAuthAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: oauthService.linkAccount,
    onSuccess: (data) => {
      if (data.status === "success") {
        toast.success(data.message || "Account linked successfully");
        // Invalidate connections to refresh the list
        queryClient.invalidateQueries({ queryKey: oauthKeys.connections() });
      } else {
        toast.error(data.message || "Failed to link account");
      }
    },
    onError: (error: any) => {
      console.error("Link OAuth account error:", error);
      toast.error(error?.response?.data?.message || "Failed to link account");
    },
  });
};

/**
 * Hook to unlink OAuth account
 */
export const useUnlinkOAuthAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: oauthService.unlinkAccount,
    onSuccess: (data) => {
      if (data.status === "success") {
        toast.success(data.message || "Account unlinked successfully");
        // Invalidate connections to refresh the list
        queryClient.invalidateQueries({ queryKey: oauthKeys.connections() });
      } else {
        toast.error(data.message || "Failed to unlink account");
      }
    },
    onError: (error: any) => {
      console.error("Unlink OAuth account error:", error);
      toast.error(error?.response?.data?.message || "Failed to unlink account");
    },
  });
};

/**
 * Hook to get OAuth providers with connection status
 */
export const useOAuthProviders = () => {
  const { data: connectionsData, isLoading } = useOAuthConnections();

  const providers: OAuthProvider[] = [
    {
      name: "google",
      displayName: "Google",
      icon: "🔍",
      color: "#4285f4",
      isConnected: false,
    },
    {
      name: "microsoft",
      displayName: "Microsoft",
      icon: "🪟",
      color: "#00a1f1",
      isConnected: false,
    },
  ];

  if (connectionsData?.connections) {
    for (const provider of providers) {
      const connection = connectionsData.connections?.find(
        (conn) => conn.provider === provider.name
      );
      if (connection) {
        provider.isConnected = true;
        provider.connectedAt = connection.createdAt;
      }
    }
  }

  return {
    providers,
    isLoading,
    connections: connectionsData?.connections || [],
  };
};

/**
 * Hook to initiate OAuth flow
 */
export const useInitiateOAuth = () => {
  const initiateOAuth = (provider: SupportedOAuthProvider) => {
    // biome-ignore lint/nursery/noUnnecessaryConditions: false positive
    switch (provider) {
      case "google":
        oauthService.initiateGoogleOAuth();
        break;
      case "microsoft":
        oauthService.initiateMicrosoftOAuth();
        break;
      default:
        toast.error("Unsupported OAuth provider");
    }
  };

  return { initiateOAuth };
};
