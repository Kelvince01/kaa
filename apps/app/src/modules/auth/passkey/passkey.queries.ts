"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { queryClient } from "@/query/query-client";
import { useAuthStore } from "../auth.store";
import { passkeyService } from "./passkey.service";
import type {
  PasskeyEnrollRequest,
  PasskeyVerifyOptionsRequest,
} from "./passkey.type";
import { passkeyUtils } from "./passkey.utils";

export const passkeyKeys = {
  all: ["passkey"] as const,
  user: (userId: string) => [...passkeyKeys.all, "user", userId] as const,
  userEmail: (email: string) => [...passkeyKeys.all, "email", email] as const,
  list: (userId: string) => [...passkeyKeys.all, "list", userId] as const,
  hasPasskey: (email: string) => [...passkeyKeys.all, "has", email] as const,
} as const;

// Hook to check if user has a passkey
export const useHasPasskey = (email: string) => {
  return useQuery({
    queryKey: passkeyKeys.hasPasskey(email),
    queryFn: () => passkeyService.hasPasskey(email),
    enabled: !!email,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get user's passkey
export const useGetPasskey = (userId: string) =>
  useQuery({
    queryKey: passkeyKeys.user(userId),
    queryFn: () => passkeyService.getPasskey(userId),
    enabled: !!userId,
  });

// Hook to get user's passkey by email
export const useGetPasskeyByEmail = (email: string) =>
  useQuery({
    queryKey: passkeyKeys.userEmail(email),
    queryFn: () => passkeyService.getPasskeyByEmail(email),
    enabled: !!email,
  });

// Hook to list user's passkeys
export const useListPasskeys = (userId: string) =>
  useQuery({
    queryKey: passkeyKeys.list(userId),
    queryFn: () => passkeyService.getUserPasskeys(userId),
    enabled: !!userId,
  });

// Hook to enroll a new passkey
export const useEnrollPasskey = () => {
  const { user } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      // Check browser support
      if (!passkeyUtils.isSupported()) {
        throw new Error("Your browser doesn't support passkeys");
      }

      const canCreate = await passkeyUtils.canCreatePlatformAuthenticator();
      if (!canCreate) {
        throw new Error("This device cannot create passkeys");
      }

      // Get enrollment options from server
      const enrollRequest: PasskeyEnrollRequest = {
        authCodeStore: {
          user: {
            id: user?.id || "",
            email: user?.email || "",
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
          },
        },
      };

      const enrollResponse =
        await passkeyService.getEnrollOptions(enrollRequest);
      if (
        enrollResponse.status !== "success" ||
        !enrollResponse.enrollOptions
      ) {
        throw new Error(
          enrollResponse.message || "Failed to get enrollment options"
        );
      }

      // Generate WebAuthn options
      const options = passkeyUtils.generateEnrollmentOptions(
        enrollResponse.enrollOptions.rpId,
        "KAA SaaS", // Replace with your app name
        enrollResponse.enrollOptions.userId,
        enrollResponse.enrollOptions.userEmail,
        enrollResponse.enrollOptions.userDisplayName,
        enrollResponse.enrollOptions.challenge
      );

      // Debug: Log the options being sent to WebAuthn
      console.log("WebAuthn options:", options);

      // Start WebAuthn enrollment
      const credential = await passkeyUtils.startEnrollment(options);

      // Debug: Log the credential response structure
      console.log("Credential response:", credential);

      // Ensure all required properties are present in the credential
      if (
        !(
          credential.response?.clientDataJSON &&
          credential.response?.attestationObject
        )
      ) {
        console.error("Missing credential properties:", {
          hasClientDataJSON: !!credential.response?.clientDataJSON,
          hasAttestationObject: !!credential.response?.attestationObject,
          response: credential.response,
        });
        throw new Error(
          "Invalid credential response: missing required properties"
        );
      }

      // Debug: Log what we're sending to the server
      const enrollData = {
        authCodeStore: {
          user: {
            id: user?.id || "",
            email: user?.email || "",
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
          },
        },
        enrollInfo: {
          id: credential.id,
          rawId: credential.rawId,
          type: credential.type,
          clientDataJSON: credential.response.clientDataJSON,
          attestationObject: credential.response.attestationObject,
          // Also include any other properties that might be expected
          ...(credential.response.transports && {
            transports: credential.response.transports,
          }),
        },
      };

      console.log("Sending enrollment data to server:", enrollData);

      // Process enrollment with server
      const processResponse = await passkeyService.processEnroll(enrollData);

      if (processResponse.status !== "success") {
        throw new Error(
          processResponse.message || "Failed to process enrollment"
        );
      }

      // Create the passkey record
      const createResponse = await passkeyService.createPasskey({
        userId: user?.id || "",
        credentialId: processResponse.passkeyId || "",
        publicKey: processResponse.passkeyPublickey || "",
        counter: processResponse.passkeyCounter || 0,
      });

      if (createResponse.status !== "success") {
        throw new Error(createResponse.message || "Failed to save passkey");
      }

      // Store passkey info locally
      passkeyUtils.storePasskeyInfo(
        user?.id || "",
        processResponse.passkeyId || ""
      );

      return createResponse;
    },
    onSuccess: () => {
      toast.success("Passkey created successfully!");
      queryClient.invalidateQueries({ queryKey: passkeyKeys.all });
    },
    onError: (error: any) => {
      const message = error.message || "Failed to create passkey";
      toast.error(message);
    },
  });
};

// Hook to verify with passkey (login)
export const useVerifyPasskey = () => {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();

  return useMutation({
    mutationFn: async (email: string) => {
      // Check browser support
      if (!passkeyUtils.isSupported()) {
        throw new Error("Your browser doesn't support passkeys");
      }

      // Get verification options from server
      const verifyRequest: PasskeyVerifyOptionsRequest = { email };
      const verifyResponse =
        await passkeyService.getVerifyOptions(verifyRequest);

      if (verifyResponse.status !== "success" || !verifyResponse.options) {
        throw new Error(
          verifyResponse.message || "Failed to get verification options"
        );
      }

      // Start WebAuthn authentication
      const credential = await passkeyUtils.startVerification(
        verifyResponse.options
      );

      // Process verification with server
      const processResponse = await passkeyService.processVerify(email, {
        passkeyInfo: credential,
      });

      if (processResponse.status !== "success") {
        throw new Error(processResponse.message || "Failed to verify passkey");
      }

      // Update passkey counter
      if (
        processResponse.passkeyId &&
        processResponse.newCounter !== undefined
      ) {
        await passkeyService.updatePasskeyCounter(processResponse.passkeyId, {
          counter: processResponse.newCounter,
        });
      }

      return processResponse;
    },
    onSuccess: (data) => {
      if (data.user) {
        // This would typically return auth tokens from the server
        // For now, we'll just show success
        toast.success("Successfully authenticated with passkey!");

        // You would typically set the user and tokens here
        // setUser(data.user);
        // setTokens(data.tokens);

        // Redirect based on user role
        // const redirectPath = getRoleRedirect(data.user.role);
        // router.push(redirectPath);
      }
    },
    onError: (error: any) => {
      const message = error.message || "Failed to authenticate with passkey";
      toast.error(message);
    },
  });
};

// Hook to delete a passkey
export const useDeletePasskey = () => {
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async (passkeyId: string) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      return await passkeyService.deletePasskey(passkeyId, user.id);
    },
    onSuccess: () => {
      toast.success("Passkey deleted successfully");
      queryClient.invalidateQueries({ queryKey: passkeyKeys.all });
      passkeyUtils.clearStoredPasskeyInfo();
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to delete passkey";
      toast.error(message);
    },
  });
};
