export { default as AccessibilityService } from "./accessibility.service";

// Accessibility utilities for frontend
export const isScreenReaderActive = (): boolean => {
  if (typeof window === "undefined") return false;

  return !!(
    window.navigator.userAgent.includes("NVDA") ||
    window.navigator.userAgent.includes("JAWS") ||
    window.navigator.userAgent.includes("VoiceOver") ||
    window.speechSynthesis
  );
};

export const hasVoiceRecognition = (): boolean => {
  if (typeof window === "undefined") return false;

  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
};

export const supportsTextToSpeech = (): boolean => {
  if (typeof window === "undefined") return false;

  return "speechSynthesis" in window;
};

export const getVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];

  return window.speechSynthesis.getVoices();
};

export const announceToScreenReader = (
  message: string,
  priority: "polite" | "assertive" = "polite"
): void => {
  if (typeof document === "undefined") return;

  const regionId = `accessibility-announcements-${priority}`;
  let region = document.getElementById(regionId);

  if (!region) {
    region = document.createElement("div");
    region.setAttribute("aria-live", priority);
    region.setAttribute("aria-atomic", "true");
    region.className = "sr-only";
    region.id = regionId;
    document.body.appendChild(region);
  }

  region.textContent = message;

  // Clear after announcement
  setTimeout(() => {
    if (region) region.textContent = "";
  }, 1000);
};
