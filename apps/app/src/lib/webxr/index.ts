export { default as WebXRService } from "./webxr-service";

// WebXR utilities for frontend
export const isWebXRSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return "xr" in navigator;
};

export const isVRSupported = async (): Promise<boolean> => {
  if (!isWebXRSupported()) return false;

  try {
    return (await (navigator as any).xr?.isSessionSupported(
      "immersive-vr"
    )) as boolean;
  } catch {
    return false;
  }
};

export const isARSupported = async (): Promise<boolean> => {
  if (!isWebXRSupported()) return false;

  try {
    return (await (navigator as any).xr?.isSessionSupported(
      "immersive-ar"
    )) as boolean;
  } catch {
    return false;
  }
};

export const getXRCapabilities = async (): Promise<{
  webxr: boolean;
  vr: boolean;
  ar: boolean;
  handTracking: boolean;
  eyeTracking: boolean;
}> => {
  if (!isWebXRSupported()) {
    return {
      webxr: false,
      vr: false,
      ar: false,
      handTracking: false,
      eyeTracking: false,
    };
  }

  const [vr, ar] = await Promise.all([isVRSupported(), isARSupported()]);

  return {
    webxr: true,
    vr,
    ar,
    handTracking: false, // Would need to check with actual session
    eyeTracking: false, // Would need to check with actual session
  };
};
