/**
 * Mobile Optimization and PWA Service for Virtual Tours (Frontend)
 * Handles mobile-first features, progressive web app capabilities, and device optimization
 */

import { EventEmitter } from "node:events";

type DeviceCapabilities = {
  deviceType: "mobile" | "tablet" | "desktop";
  screenSize: { width: number; height: number };
  pixelRatio: number;
  orientation: "portrait" | "landscape";
  touchSupport: boolean;
  gyroscope: boolean;
  accelerometer: boolean;
  geolocation: boolean;
  camera: boolean;
  battery: boolean;
  networkConnection: NetworkConnection;
  performanceProfile: "low" | "medium" | "high";
};

type NetworkConnection = {
  type: "2g" | "3g" | "4g" | "5g" | "wifi" | "ethernet" | "unknown";
  effectiveType: "slow-2g" | "2g" | "3g" | "4g";
  downlink: number;
  rtt: number;
  saveData: boolean;
};

type GestureConfig = {
  type: "tap" | "double-tap" | "pinch" | "swipe" | "rotate";
  action: string;
  sensitivity: number;
  enabled: boolean;
};

type PWAConfig = {
  offlineSupport: boolean;
  backgroundSync: boolean;
  pushNotifications: boolean;
  installPrompt: boolean;
  cacheStrategy: "network-first" | "cache-first" | "stale-while-revalidate";
  updateStrategy: "immediate" | "on-next-visit" | "user-prompt";
  storageQuota: number;
};

type BatteryStatus = {
  charging: boolean;
  level: number;
  chargingTime: number;
  dischargingTime: number;
};

type OfflineTour = {
  tourId: string;
  scenes: OfflineScene[];
  metadata: any;
  downloadDate: Date;
  expiryDate: Date;
  size: number;
};

type OfflineScene = {
  sceneId: string;
  mediaUrl: string;
  thumbnailUrl: string;
  hotspots: any[];
  cachedData: ArrayBuffer;
};

class MobilePWAService extends EventEmitter {
  private readonly pwaConfig: PWAConfig;
  private readonly deviceCapabilities: DeviceCapabilities;
  private serviceWorker: ServiceWorker | null = null;
  private readonly offlineTours: Map<string, OfflineTour> = new Map();
  private batteryAPI: any = null;
  private isInitialized = false;

  constructor() {
    super();

    this.pwaConfig = {
      offlineSupport: true,
      backgroundSync: true,
      pushNotifications: true,
      installPrompt: true,
      cacheStrategy: "stale-while-revalidate",
      updateStrategy: "user-prompt",
      storageQuota: 500 * 1024 * 1024, // 500MB
    };

    this.deviceCapabilities = this.detectDeviceCapabilities();
  }

  /**
   * Initialize mobile PWA service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || typeof window === "undefined") return;

    try {
      // Register service worker
      await this.registerServiceWorker();

      // Setup PWA install prompt
      this.setupInstallPrompt();

      // Initialize gesture recognition
      this.initializeGestureRecognition();

      // Setup battery API
      await this.initializeBatteryAPI();

      // Setup network monitoring
      this.setupNetworkMonitoring();

      // Setup orientation handling
      this.setupOrientationHandling();

      // Initialize background sync
      this.initializeBackgroundSync();

      // Setup push notifications
      await this.setupPushNotifications();

      // Apply mobile optimizations
      this.applyMobileOptimizations();

      // Initialize offline support
      await this.initializeOfflineSupport();

      this.isInitialized = true;
      this.emit("mobile-pwa-initialized");
      console.log("Mobile PWA service initialized");
    } catch (error) {
      console.error("Failed to initialize Mobile PWA service:", error);
    }
  }

  /**
   * Register service worker for PWA functionality
   */
  private async registerServiceWorker(): Promise<void> {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              this.handleServiceWorkerUpdate(registration);
            }
          });
        }
      });

      this.serviceWorker = registration.active;
      this.emit("service-worker-registered", registration);
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  }

  /**
   * Setup PWA install prompt
   */
  private setupInstallPrompt(): void {
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      this.emit("install-prompt-available", event);
    });

    window.addEventListener("appinstalled", () => {
      this.emit("pwa-installed");
    });
  }

  /**
   * Initialize gesture recognition for touch devices
   */
  private initializeGestureRecognition(): void {
    if (!this.deviceCapabilities.touchSupport) return;

    // Setup touch event listeners
    document.addEventListener("touchstart", this.handleTouchStart.bind(this), {
      passive: false,
    });
    document.addEventListener("touchmove", this.handleTouchMove.bind(this), {
      passive: false,
    });
    document.addEventListener("touchend", this.handleTouchEnd.bind(this), {
      passive: false,
    });

    // Setup gyroscope navigation if available
    if (this.deviceCapabilities.gyroscope) {
      this.initializeGyroscopeNavigation();
    }
  }

  /**
   * Handle device orientation for gyroscope navigation
   */
  private async initializeGyroscopeNavigation(): Promise<void> {
    try {
      if ("DeviceOrientationEvent" in window) {
        // Request permission for iOS 13+
        if (
          typeof (DeviceOrientationEvent as any).requestPermission ===
          "function"
        ) {
          const permission = await (
            DeviceOrientationEvent as any
          ).requestPermission();
          if (permission !== "granted") {
            console.warn("Gyroscope permission denied");
            return;
          }
        }

        window.addEventListener(
          "deviceorientation",
          this.handleDeviceOrientation.bind(this)
        );
        this.emit("gyroscope-navigation-initialized");
      }
    } catch (error) {
      console.error("Gyroscope initialization failed:", error);
    }
  }

  /**
   * Handle device orientation changes
   */
  private handleDeviceOrientation(event: DeviceOrientationEvent): void {
    const { alpha, beta, gamma } = event;

    if (alpha !== null && beta !== null && gamma !== null) {
      this.emit("device-orientation-changed", {
        alpha, // Z-axis rotation (0-360)
        beta, // X-axis rotation (-180 to 180)
        gamma, // Y-axis rotation (-90 to 90)
      });
    }
  }

  /**
   * Detect device capabilities
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    if (typeof window === "undefined") {
      // Server-side fallback
      return {
        deviceType: "desktop",
        screenSize: { width: 1920, height: 1080 },
        pixelRatio: 1,
        orientation: "landscape",
        touchSupport: false,
        gyroscope: false,
        accelerometer: false,
        geolocation: false,
        camera: false,
        battery: false,
        networkConnection: {
          type: "unknown",
          effectiveType: "4g",
          downlink: 10,
          rtt: 100,
          saveData: false,
        },
        performanceProfile: "medium",
      };
    }

    const userAgent = navigator.userAgent;
    const screenWidth = window.screen.width;

    let deviceType: DeviceCapabilities["deviceType"] = "desktop";
    if (screenWidth < 768) deviceType = "mobile";
    else if (screenWidth < 1024) deviceType = "tablet";

    return {
      deviceType,
      screenSize: { width: window.screen.width, height: window.screen.height },
      pixelRatio: window.devicePixelRatio || 1,
      orientation:
        window.innerWidth > window.innerHeight ? "landscape" : "portrait",
      touchSupport: "ontouchstart" in window,
      gyroscope: "DeviceOrientationEvent" in window,
      accelerometer: "DeviceMotionEvent" in window,
      geolocation: "geolocation" in navigator,
      camera:
        "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices,
      battery: "getBattery" in navigator,
      networkConnection: this.getNetworkConnection(),
      performanceProfile: this.calculatePerformanceProfile(),
    };
  }

  /**
   * Get network connection info
   */
  private getNetworkConnection(): NetworkConnection {
    if (typeof navigator === "undefined" || !("connection" in navigator)) {
      return {
        type: "unknown",
        effectiveType: "4g",
        downlink: 10,
        rtt: 100,
        saveData: false,
      };
    }

    const connection = (navigator as any).connection;
    return {
      type: connection.type || "unknown",
      effectiveType: connection.effectiveType || "4g",
      downlink: connection.downlink || 10,
      rtt: connection.rtt || 100,
      saveData: connection.saveData ?? false,
    };
  }

  /**
   * Calculate device performance profile
   */
  private calculatePerformanceProfile(): DeviceCapabilities["performanceProfile"] {
    if (typeof navigator === "undefined") return "medium";

    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;

    if (memory >= 8 && cores >= 8) return "high";
    if (memory >= 4 && cores >= 4) return "medium";
    return "low";
  }

  // Stub implementations for browser-only features
  private handleTouchStart(event: TouchEvent): void {
    // Handle touch start
    this.emit("touch-start", event);
  }

  private handleTouchMove(event: TouchEvent): void {
    // Handle touch move
    this.emit("touch-move", event);
  }

  private handleTouchEnd(event: TouchEvent): void {
    // Handle touch end
    this.emit("touch-end", event);
  }

  private handleServiceWorkerUpdate(
    registration: ServiceWorkerRegistration
  ): void {
    if (this.pwaConfig.updateStrategy === "immediate") {
      registration.waiting?.postMessage("skipWaiting");
      window.location.reload();
    } else if (this.pwaConfig.updateStrategy === "user-prompt") {
      this.showUpdatePrompt(registration);
    }
  }

  private showUpdatePrompt(registration: ServiceWorkerRegistration): void {
    const updateAvailable = new CustomEvent("pwa-update-available", {
      detail: { registration },
    });
    window.dispatchEvent(updateAvailable);
  }

  private async initializeBatteryAPI(): Promise<void> {
    try {
      if ("getBattery" in navigator) {
        this.batteryAPI = await (navigator as any).getBattery();
        this.setupBatteryMonitoring();
      }
    } catch (error) {
      console.warn("Battery API not available:", error);
    }
  }

  private setupBatteryMonitoring(): void {
    if (!this.batteryAPI) return;

    const updateBatteryStatus = () => {
      const status: BatteryStatus = {
        charging: this.batteryAPI.charging,
        level: this.batteryAPI.level,
        chargingTime: this.batteryAPI.chargingTime,
        dischargingTime: this.batteryAPI.dischargingTime,
      };

      this.handleBatteryStatusChange(status);
    };

    this.batteryAPI.addEventListener("chargingchange", updateBatteryStatus);
    this.batteryAPI.addEventListener("levelchange", updateBatteryStatus);

    updateBatteryStatus();
  }

  private handleBatteryStatusChange(status: BatteryStatus): void {
    // Handle battery optimizations
    if (status.level < 0.2 && !status.charging) {
      this.enableLowPowerMode();
    } else if (status.level > 0.5 || status.charging) {
      this.disableLowPowerMode();
    }

    this.emit("battery-status-changed", status);
  }

  private enableLowPowerMode(): void {
    document.body.classList.add("low-power-mode");
    this.emit("low-power-mode-enabled");
  }

  private disableLowPowerMode(): void {
    document.body.classList.remove("low-power-mode");
    this.emit("low-power-mode-disabled");
  }

  private setupNetworkMonitoring(): void {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;

      const updateNetworkInfo = () => {
        this.deviceCapabilities.networkConnection = {
          type: connection.type || "unknown",
          effectiveType: connection.effectiveType || "4g",
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 100,
          saveData: connection.saveData ?? false,
        };

        this.handleNetworkChange();
      };

      connection.addEventListener("change", updateNetworkInfo);
      updateNetworkInfo();
    }

    // Online/offline events
    window.addEventListener("online", () => {
      this.handleOnlineStatusChange(true);
    });

    window.addEventListener("offline", () => {
      this.handleOnlineStatusChange(false);
    });
  }

  private handleNetworkChange(): void {
    const connection = this.deviceCapabilities.networkConnection;

    // Adjust quality based on connection
    if (
      connection.effectiveType === "slow-2g" ||
      connection.effectiveType === "2g"
    ) {
      this.setAdaptiveQuality("low");
    } else if (connection.effectiveType === "3g") {
      this.setAdaptiveQuality("medium");
    } else {
      this.setAdaptiveQuality("high");
    }

    // Enable data saver mode if requested
    if (connection.saveData) {
      this.enableDataSaverMode();
    }

    this.emit("network-changed", connection);
  }

  private handleOnlineStatusChange(isOnline: boolean): void {
    this.emit("online-status-changed", isOnline);
  }

  private setupOrientationHandling(): void {
    const handleOrientationChange = () => {
      const orientation =
        window.innerWidth > window.innerHeight ? "landscape" : "portrait";
      this.deviceCapabilities.orientation = orientation;

      this.applyOrientationOptimizations(orientation);
      this.emit("orientation-changed", orientation);
    };

    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);

    handleOrientationChange();
  }

  private applyOrientationOptimizations(
    orientation: "portrait" | "landscape"
  ): void {
    document.body.setAttribute("data-orientation", orientation);

    if (orientation === "landscape") {
      document.body.classList.add("landscape-optimized");
    } else {
      document.body.classList.remove("landscape-optimized");
    }
  }

  private initializeBackgroundSync(): void {
    if (!(this.pwaConfig.backgroundSync || "serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data.type === "background-sync") {
        this.handleBackgroundSyncMessage(event.data);
      }
    });
  }

  private async setupPushNotifications(): Promise<void> {
    if (!(this.pwaConfig.pushNotifications && "Notification" in window)) {
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        await this.subscribeToPushNotifications();
        this.emit("push-notifications-enabled");
      }
    } catch (error) {
      console.error("Push notification setup failed:", error);
    }
  }

  private async subscribeToPushNotifications(): Promise<void> {
    if (!this.serviceWorker) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager?.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      if (subscription) {
        await this.sendSubscriptionToServer(subscription);
      }
    } catch (error) {
      console.error("Push subscription failed:", error);
    }
  }

  private async initializeOfflineSupport(): Promise<void> {
    if (!this.pwaConfig.offlineSupport) return;

    await this.loadCachedTours();
    this.emit("offline-support-initialized");
  }

  private applyMobileOptimizations(): void {
    this.applyResponsiveDesign();
    this.setupSafeAreas();
    this.setupVisibilityChangeHandling();
  }

  /**
   * Download tour for offline viewing
   */
  async downloadTourForOffline(tourId: string): Promise<boolean> {
    try {
      const tourData = await this.fetchTourData(tourId);
      const offlineTour: OfflineTour = {
        tourId,
        scenes: [],
        metadata: tourData.metadata,
        downloadDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        size: 0,
      };

      // Store in IndexedDB
      await this.saveOfflineTour(offlineTour);
      this.offlineTours.set(tourId, offlineTour);

      this.emit("tour-downloaded-offline", { tourId, size: offlineTour.size });
      return true;
    } catch (error) {
      console.error("Failed to download tour for offline:", error);
      return false;
    }
  }

  /**
   * Public API methods
   */
  getDeviceCapabilities(): DeviceCapabilities {
    return this.deviceCapabilities;
  }

  requestInstall(): boolean {
    // Implementation would show install prompt
    return false;
  }

  isOfflineAvailable(tourId: string): boolean {
    return this.offlineTours.has(tourId);
  }

  getOfflineTours(): OfflineTour[] {
    return Array.from(this.offlineTours.values());
  }

  /**
   * Get service health (for monitoring)
   */
  getHealth(): {
    status: "healthy" | "degraded" | "unhealthy";
    features: any;
    offlineTours: number;
  } {
    return {
      status: "healthy",
      features: {
        serviceWorker: !!this.serviceWorker,
        pushNotifications: "Notification" in window,
        offlineSupport: this.pwaConfig.offlineSupport,
        gyroscope: this.deviceCapabilities.gyroscope,
      },
      offlineTours: this.offlineTours.size,
    };
  }

  /**
   * Get service metrics
   */
  getMetrics(): any {
    return {
      deviceCapabilities: this.deviceCapabilities,
      offlineTours: this.offlineTours.size,
      serviceWorkerActive: !!this.serviceWorker,
      uptime: Date.now() - (this.isInitialized ? 0 : Date.now()),
    };
  }

  // Stub implementations for methods called in the service
  private setAdaptiveQuality(quality: string): void {
    this.emit("adaptive-quality-changed", quality);
  }

  private enableDataSaverMode(): void {
    document.body.classList.add("data-saver-mode");
    this.emit("data-saver-enabled");
  }

  private handleBackgroundSyncMessage(_data: any): void {
    // Handle messages from service worker
  }

  private async sendSubscriptionToServer(
    _subscription: PushSubscription
  ): Promise<void> {
    // Send subscription to backend
  }

  private async loadCachedTours(): Promise<void> {
    // Load tours from IndexedDB
  }

  private fetchTourData(_tourId: string): any {
    // Fetch tour data from API
    return { metadata: {}, scenes: [] };
  }

  private saveOfflineTour(_tour: OfflineTour): void {
    // Save to IndexedDB
  }

  private applyResponsiveDesign(): void {
    // Apply responsive design optimizations
  }

  private setupSafeAreas(): void {
    // Setup safe areas for notched devices
  }

  private setupVisibilityChangeHandling(): void {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.emit("app-backgrounded");
      } else {
        this.emit("app-foregrounded");
      }
    });
  }
}

export default new MobilePWAService();
