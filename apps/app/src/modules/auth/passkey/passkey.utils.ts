/** biome-ignore-all lint/performance/useTopLevelRegex: top level regex */
import {
  browserSupportsWebAuthn,
  browserSupportsWebAuthnAutofill,
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/types";

export const passkeyUtils = {
  /**
   * Check if the browser supports WebAuthn
   */
  isSupported: (): boolean => {
    return browserSupportsWebAuthn();
  },

  /**
   * Check if the browser supports WebAuthn autofill
   */
  supportsAutofill: async (): Promise<boolean> => {
    return await browserSupportsWebAuthnAutofill();
  },

  /**
   * Start the passkey registration process
   */
  startEnrollment: async (
    options: PublicKeyCredentialCreationOptionsJSON
  ): Promise<RegistrationResponseJSON> => {
    try {
      if (!passkeyUtils.isSupported()) {
        throw new Error("WebAuthn is not supported in this browser");
      }

      // Log the options being passed to startRegistration for debugging
      console.log("Starting registration with options:", options);

      const response = await startRegistration({ optionsJSON: options });

      // Log the response for debugging
      console.log("Registration response:", response);

      return response;
    } catch (error: any) {
      console.error("Error during passkey enrollment:", error);
      if (error.name === "NotAllowedError") {
        throw new Error("The passkey creation was cancelled or not allowed");
      }
      if (error.name === "InvalidStateError") {
        throw new Error("A passkey already exists for this account");
      }
      if (error.name === "SecurityError") {
        throw new Error("Security error occurred during passkey creation");
      }
      throw error;
    }
  },

  /**
   * Start the passkey authentication process
   */
  startVerification: async (
    options: PublicKeyCredentialRequestOptionsJSON
  ): Promise<AuthenticationResponseJSON> => {
    try {
      if (!passkeyUtils.isSupported()) {
        throw new Error("WebAuthn is not supported in this browser");
      }

      const response = await startAuthentication({ optionsJSON: options });
      return response;
    } catch (error: any) {
      if (error.name === "NotAllowedError") {
        throw new Error(
          "The passkey authentication was cancelled or not allowed"
        );
      }
      if (error.name === "InvalidStateError") {
        throw new Error("No passkey found for this account");
      }
      throw error;
    }
  },

  /**
   * Convert base64 string to Uint8Array
   */
  base64ToUint8Array: (base64: string): Uint8Array => {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(b64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  /**
   * Convert Uint8Array to base64 string
   */
  uint8ArrayToBase64: (bytes: Uint8Array): string => {
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i] as number);
    }
    return window
      .btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  },

  /**
   * Generate options for passkey registration
   */
  generateEnrollmentOptions: (
    rpId: string,
    rpName: string,
    userId: string,
    userEmail: string,
    userDisplayName: string,
    challenge: string
  ): PublicKeyCredentialCreationOptionsJSON => {
    return {
      challenge,
      rp: {
        name: rpName,
        id: rpId,
      },
      user: {
        id: passkeyUtils.uint8ArrayToBase64(new TextEncoder().encode(userId)),
        name: userEmail,
        displayName: userDisplayName,
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        requireResidentKey: false,
        userVerification: "preferred",
      },
      timeout: 60_000,
      attestation: "none",
    };
  },

  /**
   * Store passkey info in local storage for recovery
   */
  storePasskeyInfo: (userId: string, credentialId: string): void => {
    if (typeof window !== "undefined") {
      const passkeyInfo = {
        userId,
        credentialId,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("passkey_info", JSON.stringify(passkeyInfo));
    }
  },

  /**
   * Get stored passkey info
   */
  getStoredPasskeyInfo: (): {
    userId: string;
    credentialId: string;
    createdAt: string;
  } | null => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("passkey_info");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  /**
   * Clear stored passkey info
   */
  clearStoredPasskeyInfo: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("passkey_info");
    }
  },

  /**
   * Check if the current device can create platform authenticators
   */
  canCreatePlatformAuthenticator: async (): Promise<boolean> => {
    if (!passkeyUtils.isSupported()) {
      return false;
    }

    try {
      const available =
        await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch {
      return false;
    }
  },

  /**
   * Get a user-friendly device name for the passkey
   */
  getDeviceName: (): string => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;

    // Detect mobile devices
    if (/Android/i.test(userAgent)) {
      return "Android Device";
    }
    if (/iPhone/i.test(userAgent)) {
      return "iPhone";
    }
    if (/iPad/i.test(userAgent)) {
      return "iPad";
    }

    // Detect desktop platforms
    if (/Mac/i.test(platform)) {
      return "Mac";
    }
    if (/Win/i.test(platform)) {
      return "Windows PC";
    }
    if (/Linux/i.test(platform)) {
      return "Linux Computer";
    }

    return "Device";
  },
};
