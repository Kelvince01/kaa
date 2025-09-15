/**
 * WebXR Service for Advanced VR/AR Virtual Tours (Frontend)
 * Implements WebXR API for immersive virtual reality and augmented reality experiences
 */

import { EventEmitter } from "node:events";

type XRDevice = {
  id: string;
  type: "vr" | "ar" | "mixed";
  name: string;
  isConnected: boolean;
  capabilities: XRCapabilities;
};

type XRCapabilities = {
  handTracking: boolean;
  eyeTracking: boolean;
  spatialMapping: boolean;
  roomScale: boolean;
  passthrough: boolean;
  dof: boolean;
  hapticFeedback: boolean;
};

type AdvancedXRSettings = {
  webxr: {
    enabled: boolean;
    supportedDevices: ("vr" | "ar" | "mixed")[];
    handTracking: boolean;
    eyeTracking: boolean;
    spatialMapping: boolean;
    roomScale: boolean;
  };
  hapticFeedback: {
    enabled: boolean;
    intensity: number;
    patterns: HapticPattern[];
  };
  spatialAudio: {
    enabled: boolean;
    ambientSounds: string[];
    positionalAudio: boolean;
  };
  multiUser: {
    enabled: boolean;
    maxParticipants: number;
    voiceChat: boolean;
    avatars: boolean;
  };
};

type HapticPattern = {
  name: string;
  pattern: number[];
  duration: number;
  intensity: number;
};

type SpatialAnchor = {
  id: string;
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
  persistent: boolean;
  sceneId?: string;
  hotspotId?: string;
};

type HandPose = {
  left: HandState;
  right: HandState;
};

type HandState = {
  joints: XRJointSpace[];
  gestures: string[];
  confidence: number;
};

type EyeTrackingData = {
  gazeOrigin: { x: number; y: number; z: number };
  gazeDirection: { x: number; y: number; z: number };
  fixation: FixationPoint;
};

type FixationPoint = {
  x: number;
  y: number;
  duration: number;
  confidence: number;
};

class WebXRService extends EventEmitter {
  private xrSession: XRSession | null = null;
  private xrReferenceSpace: XRReferenceSpace | null = null;
  private readonly connectedDevices: Map<string, XRDevice> = new Map();
  private readonly spatialAnchors: Map<string, SpatialAnchor> = new Map();
  private isSessionActive = false;
  private settings: AdvancedXRSettings | null = null;
  private handTracker: XRHand[] = [];
  private eyeTracker: any = null;
  private hapticDevices: GamepadHapticActuator[] = [];
  private isInitialized = false;

  constructor() {
    super();

    // Only initialize in browser environment
    if (typeof window !== "undefined") {
      this.initializeXRSupport();
    }
  }

  /**
   * Initialize WebXR support detection
   */
  private async initializeXRSupport(): Promise<void> {
    if (!navigator.xr) {
      console.warn("WebXR not supported in this browser");
      return;
    }

    try {
      // Check for VR support
      const vrSupported = await navigator.xr.isSessionSupported("immersive-vr");
      if (vrSupported) {
        console.log("VR sessions supported");
      }

      // Check for AR support
      const arSupported = await navigator.xr.isSessionSupported("immersive-ar");
      if (arSupported) {
        console.log("AR sessions supported");
      }

      this.emit("xr-support-detected", { vr: vrSupported, ar: arSupported });
    } catch (error) {
      console.error("Error checking XR support:", error);
    }
  }

  /**
   * Initialize WebXR service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === "undefined") return;

    try {
      await this.initializeXRSupport();
      this.isInitialized = true;
      this.emit("webxr-initialized");
      console.log("WebXR Service initialized");
    } catch (error) {
      console.error("Failed to initialize WebXR service:", error);
    }
  }

  /**
   * Start an immersive XR session
   */
  async startXRSession(
    mode: "vr" | "ar",
    settings: AdvancedXRSettings
  ): Promise<void> {
    if (!navigator.xr) {
      throw new Error("WebXR not supported");
    }

    this.settings = settings;

    try {
      const sessionMode = mode === "vr" ? "immersive-vr" : "immersive-ar";
      const requiredFeatures = this.buildRequiredFeatures(settings);
      const optionalFeatures = this.buildOptionalFeatures(settings);

      this.xrSession = await navigator.xr.requestSession(sessionMode, {
        requiredFeatures,
        optionalFeatures,
      });

      // Set up reference space
      this.xrReferenceSpace = await this.xrSession.requestReferenceSpace(
        settings.webxr.roomScale ? "bounded-floor" : "local-floor"
      );

      // Initialize features
      await this.initializeXRFeatures();

      // Set up event listeners
      this.setupXREventListeners();

      this.isSessionActive = true;
      this.emit("xr-session-started", { mode, session: this.xrSession });
    } catch (error) {
      console.error("Failed to start XR session:", error);
      throw new Error(
        `Failed to start ${mode.toUpperCase()} session: ${error}`
      );
    }
  }

  /**
   * End XR session
   */
  async endXRSession(): Promise<void> {
    if (this.xrSession) {
      await this.xrSession.end();
      this.xrSession = null;
      this.xrReferenceSpace = null;
      this.isSessionActive = false;
      this.handTracker = [];
      this.eyeTracker = null;
      this.hapticDevices = [];

      this.emit("xr-session-ended");
    }
  }

  /**
   * Initialize advanced XR features
   */
  private async initializeXRFeatures(): Promise<void> {
    if (!(this.xrSession && this.settings)) return;

    // Hand tracking
    if (this.settings.webxr.handTracking) {
      await this.initializeHandTracking();
    }

    // Eye tracking
    if (this.settings.webxr.eyeTracking) {
      await this.initializeEyeTracking();
    }

    // Spatial mapping
    if (this.settings.webxr.spatialMapping) {
      await this.initializeSpatialMapping();
    }

    // Haptic feedback
    if (this.settings.hapticFeedback.enabled) {
      await this.initializeHapticFeedback();
    }
  }

  /**
   * Initialize hand tracking
   */
  private async initializeHandTracking(): Promise<void> {
    try {
      // biome-ignore lint/style/noNonNullAssertion: false positive
      if ("requestHands" in this.xrSession!) {
        // @ts-expect-error - WebXR Hands API
        const hands = await this.xrSession.requestHands();
        this.handTracker = hands;

        this.emit("hand-tracking-initialized");
        console.log("Hand tracking initialized");
      }
    } catch (error) {
      console.warn("Hand tracking not available:", error);
    }
  }

  /**
   * Initialize eye tracking
   */
  private async initializeEyeTracking(): Promise<void> {
    try {
      // biome-ignore lint/style/noNonNullAssertion: false positive
      if ("requestGazeInput" in this.xrSession!) {
        // @ts-expect-error
        this.eyeTracker = await this.xrSession.requestGazeInput();
        this.emit("eye-tracking-initialized");
        console.log("Eye tracking initialized");
      }
    } catch (error) {
      console.warn("Eye tracking not available:", error);
    }
  }

  /**
   * Initialize spatial mapping
   */
  private async initializeSpatialMapping(): Promise<void> {
    try {
      // biome-ignore lint/style/noNonNullAssertion: false positive
      if ("requestPlaneDetection" in this.xrSession!) {
        // @ts-expect-error
        await this.xrSession.requestPlaneDetection();
        this.emit("spatial-mapping-initialized");
        console.log("Spatial mapping initialized");
      }
    } catch (error) {
      console.warn("Spatial mapping not available:", error);
    }
  }

  /**
   * Initialize haptic feedback
   */
  private initializeHapticFeedback(): void {
    try {
      const gamepads = navigator.getGamepads();
      for (const gamepad of gamepads) {
        if (gamepad?.hapticActuators) {
          this.hapticDevices.push(...gamepad.hapticActuators);
        }
      }

      if (this.hapticDevices.length > 0) {
        this.emit("haptic-feedback-initialized");
        console.log("Haptic feedback initialized");
      }
    } catch (error) {
      console.warn("Haptic feedback not available:", error);
    }
  }

  /**
   * Set up XR event listeners
   */
  private setupXREventListeners(): void {
    if (!this.xrSession) return;

    this.xrSession.addEventListener("end", () => {
      this.isSessionActive = false;
      this.emit("xr-session-ended");
    });

    this.xrSession.addEventListener("inputsourceschange", (event) => {
      this.handleInputSourcesChange(event);
    });

    this.xrSession.addEventListener("select", (event) => {
      this.handleSelect(event);
    });
  }

  /**
   * Handle input source changes
   */
  private handleInputSourcesChange(event: any): void {
    for (const inputSource of event.added) {
      console.log("Input source added:", inputSource);
      this.emit("input-source-added", inputSource);
    }

    for (const inputSource of event.removed) {
      console.log("Input source removed:", inputSource);
      this.emit("input-source-removed", inputSource);
    }
  }

  /**
   * Handle select events
   */
  private handleSelect(event: any): void {
    const inputSource = event.inputSource;
    const pose = event.frame.getPose(
      inputSource.targetRaySpace,
      this.xrReferenceSpace
    );

    if (pose) {
      this.emit("xr-select", {
        position: pose.transform.position,
        orientation: pose.transform.orientation,
        inputSource,
      });
    }
  }

  /**
   * Get current hand poses
   */
  getHandPoses(frame: XRFrame): HandPose | null {
    if (!this.handTracker || this.handTracker.length === 0) return null;

    try {
      const leftHand = this.handTracker[0];
      const rightHand = this.handTracker[1];

      const leftJoints: any[] = [];
      const rightJoints: any[] = [];

      // Get joint positions for both hands
      if (leftHand) {
        for (const [joint, space] of leftHand) {
          // biome-ignore lint/style/noNonNullAssertion: false positive
          const pose = frame.getJointPose?.(space, this.xrReferenceSpace!);
          if (pose) {
            leftJoints.push({
              joint,
              position: pose.transform.position,
              orientation: pose.transform.orientation,
            });
          }
        }
      }

      if (rightHand) {
        for (const [joint, space] of rightHand) {
          // biome-ignore lint/style/noNonNullAssertion: false positive
          const pose = frame.getJointPose?.(space, this.xrReferenceSpace!);
          if (pose) {
            rightJoints.push({
              joint,
              position: pose.transform.position,
              orientation: pose.transform.orientation,
            });
          }
        }
      }

      return {
        left: {
          joints: leftJoints,
          gestures: this.recognizeGestures(leftJoints),
          confidence: 0.8,
        },
        right: {
          joints: rightJoints,
          gestures: this.recognizeGestures(rightJoints),
          confidence: 0.8,
        },
      };
    } catch (error) {
      console.error("Error getting hand poses:", error);
      return null;
    }
  }

  /**
   * Get eye tracking data
   */
  getEyeTrackingData(frame: XRFrame): EyeTrackingData | null {
    if (!this.eyeTracker) return null;

    try {
      // @ts-expect-error - WebXR Eye Tracking API
      const gazeInput = frame.getGazeInput();
      if (gazeInput) {
        return {
          gazeOrigin: gazeInput.origin,
          gazeDirection: gazeInput.direction,
          fixation: {
            x: gazeInput.fixation?.x || 0,
            y: gazeInput.fixation?.y || 0,
            duration: gazeInput.fixation?.duration || 0,
            confidence: gazeInput.fixation?.confidence || 0,
          },
        };
      }
    } catch (error) {
      console.error("Error getting eye tracking data:", error);
    }

    return null;
  }

  /**
   * Create spatial anchor
   */
  createSpatialAnchor(
    position: { x: number; y: number; z: number },
    orientation: { x: number; y: number; z: number; w: number },
    persistent = false
  ): Promise<SpatialAnchor> {
    const anchor: SpatialAnchor = {
      id: crypto.randomUUID(),
      position,
      orientation,
      persistent,
    };

    this.spatialAnchors.set(anchor.id, anchor);
    this.emit("spatial-anchor-created", anchor);

    return Promise.resolve(anchor);
  }

  /**
   * Trigger haptic feedback
   */
  async triggerHapticFeedback(pattern: HapticPattern): Promise<void> {
    if (
      !this.settings?.hapticFeedback.enabled ||
      this.hapticDevices.length === 0
    ) {
      return;
    }

    try {
      for (const device of this.hapticDevices) {
        await device.playEffect("dual-rumble", {
          duration: pattern.duration,
          strongMagnitude: pattern.intensity,
          weakMagnitude: pattern.intensity * 0.5,
        });
      }
    } catch (error) {
      console.error("Error triggering haptic feedback:", error);
    }
  }

  /**
   * Enable spatial audio
   */
  enableSpatialAudio(audioContext: AudioContext): void {
    if (!this.settings?.spatialAudio.enabled) return;

    try {
      // Create spatial audio context
      const panner = audioContext.createPanner();
      panner.panningModel = "HRTF";
      panner.distanceModel = "inverse";
      panner.refDistance = 1;
      panner.maxDistance = 10_000;
      panner.rolloffFactor = 1;
      panner.coneInnerAngle = 360;
      panner.coneOuterAngle = 0;
      panner.coneOuterGain = 0;

      this.emit("spatial-audio-enabled", panner);
    } catch (error) {
      console.error("Error enabling spatial audio:", error);
    }
  }

  /**
   * Build required features list
   */
  private buildRequiredFeatures(settings: AdvancedXRSettings): string[] {
    const features: string[] = [];

    if (settings.webxr.roomScale) {
      features.push("bounded-floor");
    } else {
      features.push("local-floor");
    }

    return features;
  }

  /**
   * Build optional features list
   */
  private buildOptionalFeatures(settings: AdvancedXRSettings): string[] {
    const features: string[] = [];

    if (settings.webxr.handTracking) {
      features.push("hand-tracking");
    }

    if (settings.webxr.eyeTracking) {
      features.push("gaze-input");
    }

    if (settings.webxr.spatialMapping) {
      features.push("plane-detection");
    }

    return features;
  }

  /**
   * Recognize hand gestures
   */
  private recognizeGestures(joints: any[]): string[] {
    const gestures: string[] = [];

    // Simple gesture recognition (can be enhanced with ML)
    if (joints.length > 0) {
      // Example: detect pointing gesture
      // This would be replaced with proper gesture recognition
      gestures.push("point");
    }

    return gestures;
  }

  /**
   * Get session status
   */
  getSessionStatus(): {
    isActive: boolean;
    mode: string | null;
    features: string[];
    devices: XRDevice[];
  } {
    return {
      isActive: this.isSessionActive,
      mode: this.xrSession?.environmentBlendMode || null,
      features: Array.from(this.xrSession?.enabledFeatures || []),
      devices: Array.from(this.connectedDevices.values()),
    };
  }

  /**
   * Check if feature is supported
   */
  async isFeatureSupported(feature: string): Promise<boolean> {
    if (!navigator.xr) return false;

    try {
      const session = await navigator.xr.requestSession("inline", {
        optionalFeatures: [feature],
      });
      const isSupported = session.enabledFeatures?.includes(feature);
      await session.end();
      return isSupported ?? false;
    } catch {
      return false;
    }
  }

  /**
   * Get service health (frontend-specific)
   */
  getHealth(): {
    status: "healthy" | "degraded" | "unhealthy";
    webxrSupported: boolean;
    activeSession: boolean;
    deviceCount: number;
  } {
    const webxrSupported = typeof navigator !== "undefined" && !!navigator.xr;

    return {
      status: webxrSupported ? "healthy" : "degraded",
      webxrSupported,
      activeSession: this.isSessionActive,
      deviceCount: this.connectedDevices.size,
    };
  }

  /**
   * Get service metrics
   */
  getMetrics(): any {
    return {
      webxrSupported: typeof navigator !== "undefined" && !!navigator.xr,
      activeSession: this.isSessionActive,
      connectedDevices: this.connectedDevices.size,
      spatialAnchors: this.spatialAnchors.size,
      isInitialized: this.isInitialized,
      uptime: this.isInitialized ? Date.now() : 0,
    };
  }
}

export default new WebXRService();
