export { default as MobilePWAService } from "./mobile-pwa-service";

// Mobile-specific utilities for frontend
export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
};

export const isTabletDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

export const isTouchDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window;
};

export const hasGyroscope = (): boolean => {
  if (typeof window === "undefined") return false;
  return "DeviceOrientationEvent" in window;
};

export const getNetworkInfo = (): any => {
  if (typeof navigator === "undefined" || !("connection" in navigator)) {
    return { effectiveType: "4g", downlink: 10 };
  }

  const connection = (navigator as any).connection;
  return {
    type: connection.type || "unknown",
    effectiveType: connection.effectiveType || "4g",
    downlink: connection.downlink || 10,
    rtt: connection.rtt || 100,
    saveData: connection.saveData ?? false,
  };
};
