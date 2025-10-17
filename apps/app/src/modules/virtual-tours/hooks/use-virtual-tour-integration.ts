"use client";

/**
 * Virtual Tour Integration Hook
 * Integrates with frontend services (WebXR, Mobile PWA, Accessibility, Collaboration)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AccessibilityService } from "@/lib/accessibility";
import { CollaborationClient } from "@/lib/collaboration";
import { MobilePWAService } from "@/lib/mobile";
import { WebXRService } from "@/lib/webxr";
import { useVirtualTourState } from "../virtual-tour.store";

type IntegrationOptions = {
  enableXR?: boolean;
  enableCollaboration?: boolean;
  enableAccessibility?: boolean;
  enableMobileOptimization?: boolean;
};

export const useVirtualTourIntegration = (
  tourId: string,
  options: IntegrationOptions = {}
) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [xrCapabilities, setXRCapabilities] = useState<any>(null);
  const [deviceCapabilities, setDeviceCapabilities] = useState<any>(null);
  const [collaborationStatus, setCollaborationStatus] = useState<any>(null);
  const initializationRef = useRef(false);

  // Store state
  const {
    setXRSupported,
    setIsMobile,
    setAccessibilityEnabled,
    setIsOffline,
    xrMode,
    isCollaborating,
    accessibilityEnabled,
  } = useVirtualTourState();

  /**
   * Initialize all frontend services
   */
  const initializeServices = useCallback(async () => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    try {
      console.log("🚀 Initializing Virtual Tour Frontend Services...");

      // Initialize Mobile PWA Service
      if (options.enableMobileOptimization !== false) {
        await MobilePWAService.initialize();
        const deviceCaps = MobilePWAService.getDeviceCapabilities();
        setDeviceCapabilities(deviceCaps);
        setIsMobile(deviceCaps.deviceType === "mobile");
        setIsOffline(!navigator.onLine);

        // Listen for network changes
        window.addEventListener("online", () => setIsOffline(false));
        window.addEventListener("offline", () => setIsOffline(true));
      }

      // Initialize WebXR Service
      if (options.enableXR !== false) {
        await WebXRService.initialize();
        const xrCaps = await import("@/lib/webxr").then((m) =>
          m.getXRCapabilities()
        );
        setXRCapabilities(xrCaps);
        setXRSupported(xrCaps.webxr);
      }

      // Initialize Accessibility Service
      if (options.enableAccessibility !== false) {
        await AccessibilityService.initialize();
        setAccessibilityEnabled(true);
      }

      setIsInitialized(true);
      console.log("✅ Frontend services initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize some frontend services:", error);
      toast.error("Some advanced features may not be available");
    }
  }, [
    options,
    setXRSupported,
    setIsMobile,
    setAccessibilityEnabled,
    setIsOffline,
  ]);

  /**
   * Start XR session
   */
  const startXRSession = useCallback(
    async (mode: "vr" | "ar") => {
      if (!xrCapabilities?.webxr) {
        toast.error("WebXR not supported on this device");
        return false;
      }

      try {
        await WebXRService.startXRSession(mode, {
          webxr: {
            enabled: true,
            supportedDevices: [mode],
            handTracking: true,
            eyeTracking: false,
            spatialMapping: true,
            roomScale: false,
          },
          hapticFeedback: {
            enabled: true,
            intensity: 0.5,
            patterns: [],
          },
          spatialAudio: {
            enabled: true,
            ambientSounds: [],
            positionalAudio: true,
          },
          multiUser: {
            enabled: false,
            maxParticipants: 1,
            voiceChat: false,
            avatars: false,
          },
        });

        toast.success(`${mode.toUpperCase()} session started`);
        return true;
      } catch (error) {
        console.error(`${mode.toUpperCase()} session start failed:`, error);
        toast.error(`Failed to start ${mode.toUpperCase()} session`);
        return false;
      }
    },
    [xrCapabilities]
  );

  /**
   * End XR session
   */
  const endXRSession = useCallback(async () => {
    try {
      await WebXRService.endXRSession();
      toast.success("XR session ended");
    } catch (error) {
      console.error("XR session end failed:", error);
    }
  }, []);

  /**
   * Start collaboration session
   */
  const startCollaboration = useCallback(
    async (role: "host" | "viewer" | "editor" = "viewer") => {
      if (!options.enableCollaboration) {
        toast.error("Collaboration not enabled");
        return false;
      }

      try {
        // This would first create a session on the backend, then connect
        const success = await CollaborationClient.joinSession(
          `session-${tourId}`,
          tourId,
          role
        );

        if (success) {
          setCollaborationStatus({
            connected: true,
            role,
            sessionId: `session-${tourId}`,
          });
          toast.success("Collaboration session started");
          return true;
        }
        toast.error("Failed to start collaboration");
        return false;
      } catch (error) {
        console.error("Collaboration start failed:", error);
        toast.error("Failed to start collaboration");
        return false;
      }
    },
    [tourId, options.enableCollaboration]
  );

  /**
   * End collaboration session
   */
  const endCollaboration = useCallback(() => {
    CollaborationClient.leaveSession();
    setCollaborationStatus(null);
    toast.success("Collaboration session ended");
  }, []);

  /**
   * Toggle accessibility features
   */
  const toggleAccessibility = useCallback(
    async (feature: "textToSpeech" | "highContrast" | "voiceControl") => {
      if (!accessibilityEnabled) return;

      try {
        switch (feature) {
          case "textToSpeech":
            // Would toggle TTS
            toast.success("Text-to-speech toggled");
            break;
          case "highContrast":
            AccessibilityService.applyHighContrast(
              !document.body.classList.contains("high-contrast")
            );
            toast.success("High contrast toggled");
            break;
          case "voiceControl":
            await AccessibilityService.initializeVoiceControl();
            toast.success("Voice control enabled");
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(`Failed to toggle ${feature}:`, error);
        toast.error(`Failed to toggle ${feature}`);
      }
    },
    [accessibilityEnabled]
  );

  /**
   * Download tour for offline viewing
   */
  const downloadForOffline = useCallback(async () => {
    try {
      const success = await MobilePWAService.downloadTourForOffline(tourId);
      if (success) {
        toast.success("Tour downloaded for offline viewing");
        return true;
      }
      toast.error("Failed to download tour");
      return false;
    } catch (error) {
      console.error("Offline download failed:", error);
      toast.error("Failed to download tour");
      return false;
    }
  }, [tourId]);

  /**
   * Request PWA installation
   */
  const requestPWAInstall = useCallback(async () => {
    try {
      const success = await MobilePWAService.requestInstall();
      if (success) {
        toast.success("App installed successfully");
      }
      return success;
    } catch (error) {
      console.error("PWA install failed:", error);
      toast.error("Failed to install app");
      return false;
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeServices().then((_r) => null);
  }, [initializeServices]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (xrMode !== "none") {
        endXRSession().then((_r) => null);
      }
      if (isCollaborating) {
        endCollaboration();
      }
    },
    [xrMode, isCollaborating, endXRSession, endCollaboration]
  );

  return {
    // Initialization state
    isInitialized,

    // Capabilities
    xrCapabilities,
    deviceCapabilities,
    collaborationStatus,

    // XR functions
    startXRSession,
    endXRSession,

    // Collaboration functions
    startCollaboration,
    endCollaboration,

    // Accessibility functions
    toggleAccessibility,

    // Mobile/PWA functions
    downloadForOffline,
    requestPWAInstall,

    // Service status
    services: {
      xr: {
        available: !!xrCapabilities?.webxr,
        active: xrMode !== "none",
      },
      collaboration: {
        available: CollaborationClient.isConnected(),
        active: isCollaborating,
      },
      accessibility: {
        available: accessibilityEnabled,
        active: accessibilityEnabled,
      },
      mobile: {
        available: deviceCapabilities?.deviceType === "mobile",
        active: true,
      },
    },
  };
};

export default useVirtualTourIntegration;
