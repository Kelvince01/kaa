/**
 * Virtual Tours Service for Frontend
 */

import { httpClient } from "@/lib/axios";
import type {
  CreateTourFormData,
  HotspotFormData,
  KenyaFinancingOptions,
  KenyaPropertyTaxes,
  MLAnalytics,
  SceneFormData,
  TourAnalytics,
  TourEmbedOptions,
  TourListResponse,
  VirtualTour,
  VirtualTourCapabilities,
} from "./virtual-tour.type";

// Core tour operations
export const getVirtualTours = async (
  propertyId: string,
  filters?: { status?: string; type?: string }
): Promise<TourListResponse> => {
  const response = await httpClient.api.get(
    `/virtual-tours/property/${propertyId}`,
    {
      params: filters,
    }
  );
  return response.data.data;
};

export const getVirtualTour = async (tourId: string): Promise<VirtualTour> => {
  const response = await httpClient.api.get(`/virtual-tours/${tourId}`);
  return response.data.data.tour;
};

export const createVirtualTour = async (
  tourData: CreateTourFormData
): Promise<VirtualTour> => {
  const response = await httpClient.api.post("/virtual-tours", tourData);
  return response.data.data.tour;
};

export const updateVirtualTour = async (
  tourId: string,
  updates: Partial<VirtualTour>
): Promise<VirtualTour> => {
  const response = await httpClient.api.patch(
    `/virtual-tours/${tourId}`,
    updates
  );
  return response.data.data.tour;
};

export const deleteVirtualTour = async (tourId: string): Promise<void> => {
  await httpClient.api.delete(`/virtual-tours/${tourId}`);
};

export const publishVirtualTour = async (
  tourId: string
): Promise<VirtualTour> => {
  const response = await httpClient.api.post(
    `/virtual-tours/${tourId}/publish`
  );
  return response.data.data.tour;
};

export const duplicateVirtualTour = async (
  tourId: string,
  title?: string
): Promise<VirtualTour> => {
  const response = await httpClient.api.post(
    `/virtual-tours/${tourId}/duplicate`,
    {
      title,
    }
  );
  return response.data.data.tour;
};

// Scene operations
export const addScene = async (
  tourId: string,
  sceneData: SceneFormData
): Promise<any> => {
  const response = await httpClient.api.post(
    `/virtual-tours/${tourId}/scenes`,
    sceneData
  );
  return response.data.data.scene;
};

export const updateScene = async (
  tourId: string,
  sceneId: string,
  updates: Partial<SceneFormData>
): Promise<any> => {
  const response = await httpClient.api.patch(
    `/virtual-tours/${tourId}/scenes/${sceneId}`,
    updates
  );
  return response.data.data.scene;
};

export const deleteScene = async (
  tourId: string,
  sceneId: string
): Promise<void> => {
  await httpClient.api.delete(`/virtual-tours/${tourId}/scenes/${sceneId}`);
};

// Hotspot operations
export const addHotspot = async (
  tourId: string,
  sceneId: string,
  hotspotData: HotspotFormData
): Promise<any> => {
  const response = await httpClient.api.post(
    `/virtual-tours/${tourId}/scenes/${sceneId}/hotspots`,
    hotspotData
  );
  return response.data.data.hotspot;
};

export const updateHotspot = async (
  tourId: string,
  hotspotId: string,
  updates: Partial<HotspotFormData>
): Promise<any> => {
  const response = await httpClient.api.patch(
    `/virtual-tours/${tourId}/hotspots/${hotspotId}`,
    updates
  );
  return response.data.data.hotspot;
};

export const deleteHotspot = async (
  tourId: string,
  hotspotId: string
): Promise<void> => {
  await httpClient.api.delete(`/virtual-tours/${tourId}/hotspots/${hotspotId}`);
};

// Media operations
export const uploadMedia = async (
  tourId: string,
  file: File,
  sceneId?: string,
  metadata?: Record<string, any>
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", file.name);
  formData.append("mimeType", file.type);
  if (sceneId) formData.append("sceneId", sceneId);
  if (metadata) formData.append("metadata", JSON.stringify(metadata));

  const response = await httpClient.api.post(
    `/virtual-tours/${tourId}/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data.data.mediaUrl;
};

// Analytics operations
export const getTourAnalytics = async (
  tourId: string,
  includeMl = false
): Promise<TourAnalytics | MLAnalytics> => {
  const endpoint = includeMl
    ? `/virtual-tours/${tourId}/analytics/ml`
    : `/virtual-tours/${tourId}/analytics`;

  const response = await httpClient.api.get(endpoint);
  return response.data.data.analytics;
};

export const getRealTimeMetrics = async (tourId: string): Promise<any> => {
  const response = await httpClient.api.get(
    `/virtual-tours/${tourId}/real-time-metrics`
  );
  return response.data.data;
};

export const trackTourView = async (
  tourId: string,
  metadata: {
    deviceType: string;
    location?: string;
    referrer?: string;
    sessionId: string;
  }
): Promise<void> => {
  await httpClient.api.post(`/virtual-tours/${tourId}/track/view`, metadata);
};

export const trackSceneView = async (
  tourId: string,
  sceneId: string,
  sessionId: string,
  duration: number
): Promise<void> => {
  await httpClient.api.post(`/virtual-tours/${tourId}/track/scene/${sceneId}`, {
    sessionId,
    duration,
  });
};

export const trackHotspotInteraction = async (
  tourId: string,
  hotspotId: string,
  interactionType: "view" | "click"
): Promise<void> => {
  await httpClient.api.post(
    `/virtual-tours/${tourId}/track/hotspot/${hotspotId}`,
    {
      interactionType,
    }
  );
};

// Advanced features
export const getServiceCapabilities =
  async (): Promise<VirtualTourCapabilities> => {
    const response = await httpClient.api.get("/virtual-tours/capabilities");
    return response.data.data;
  };

export const enableAdvancedMode = async (): Promise<void> => {
  await httpClient.api.post("/virtual-tours/advanced-mode/enable");
};

export const disableAdvancedMode = async (): Promise<void> => {
  await httpClient.api.post("/virtual-tours/advanced-mode/disable");
};

export const startXRSession = async (
  tourId: string,
  mode: "vr" | "ar",
  settings: any
): Promise<void> => {
  await httpClient.api.post(`/virtual-tours/${tourId}/xr-session`, {
    mode,
    settings,
  });
};

export const generateSmartConnections = async (
  tourId: string
): Promise<any> => {
  const response = await httpClient.api.post(
    `/virtual-tours/${tourId}/generate-smart-connections`
  );
  return response.data.data;
};

export const getAccessibilityReport = async (tourId: string): Promise<any> => {
  const response = await httpClient.api.get(
    `/virtual-tours/${tourId}/accessibility-report`
  );
  return response.data.data;
};

export const enableVoiceControl = async (
  tourId: string,
  platform: "alexa" | "google"
): Promise<void> => {
  await httpClient.api.post(`/virtual-tours/${tourId}/voice-control`, {
    platform,
  });
};

export const getOptimizedContentUrl = async (
  tourId: string,
  originalUrl: string,
  contentType: "image" | "video" | "3d" | "audio",
  clientIP: string
): Promise<string> => {
  const response = await httpClient.api.get(
    `/virtual-tours/${tourId}/optimized-content`,
    {
      params: {
        originalUrl,
        contentType,
        clientIP,
      },
    }
  );
  return response.data.data.optimizedUrl;
};

export const getTourRecommendations = async (
  tourId: string,
  preferences?: any
): Promise<VirtualTour[]> => {
  const response = await httpClient.api.get(
    `/virtual-tours/${tourId}/recommendations`,
    {
      params: preferences ? { preferences: JSON.stringify(preferences) } : {},
    }
  );
  return response.data.data.recommendations;
};

// Embed operations
export const getTourEmbedCode = async (
  tourId: string,
  options?: TourEmbedOptions
): Promise<string> => {
  const response = await httpClient.api.get(`/virtual-tours/${tourId}/embed`, {
    params: options,
  });
  return response.data.data.embedCode;
};

// Search and discovery
export const searchTours = async (
  query: string,
  filters?: {
    propertyType?: string;
    county?: string;
    status?: string;
    type?: string;
  }
): Promise<VirtualTour[]> => {
  const response = await httpClient.api.get("/virtual-tours/search", {
    params: { q: query, ...filters },
  });
  return response.data.data.tours;
};

export const getPopularTours = async (limit = 10): Promise<VirtualTour[]> => {
  const response = await httpClient.api.get("/virtual-tours/popular", {
    params: { limit },
  });
  return response.data.data.tours;
};

export const getUserTours = async (userId: string): Promise<VirtualTour[]> => {
  const response = await httpClient.api.get(`/virtual-tours/user/${userId}`);
  return response.data.data.tours;
};

// Service health
export const getVirtualToursHealth = async (): Promise<any> => {
  const response = await httpClient.api.get("/virtual-tours/health");
  return response.data.data;
};

export const getAdvancedServicesHealth = async (): Promise<any> => {
  const response = await httpClient.api.get(
    "/virtual-tours/advanced-services/health"
  );
  return response.data.data;
};

export const restartAdvancedService = async (
  serviceName: string
): Promise<void> => {
  await httpClient.api.post(
    `/virtual-tours/advanced-services/${serviceName}/restart`
  );
};

// Collaboration operations
export const createCollaborationSession = async (
  tourId: string
): Promise<any> => {
  const response = await httpClient.api.post(
    "/virtual-tours/collaboration/sessions",
    {
      tourId,
    }
  );
  return response.data.data.session;
};

export const getCollaborationSession = async (
  sessionId: string
): Promise<any> => {
  const response = await httpClient.api.get(
    `/virtual-tours/collaboration/sessions/${sessionId}`
  );
  return response.data.data.session;
};

export const endCollaborationSession = async (
  sessionId: string
): Promise<void> => {
  await httpClient.api.delete(
    `/virtual-tours/collaboration/sessions/${sessionId}`
  );
};

// Payment integration
export const processVirtualTourPayment = async (paymentData: {
  tourId: string;
  amount: number;
  provider: "mpesa" | "airtel_money";
  phoneNumber: string;
  reference: string;
  description: string;
}): Promise<any> => {
  const endpoint =
    paymentData.provider === "mpesa"
      ? "/payments/mpesa/pay"
      : "/payments/airtel-money/pay";

  const response = await httpClient.api.post(endpoint, {
    ...paymentData,
    description:
      paymentData.description ||
      `Virtual tour payment for ${paymentData.tourId}`,
  });

  return response.data.data;
};

// Kenya-specific features
export const calculatePropertyTaxes = async (
  propertyValue: number,
  isResident: boolean,
  purpose: "investment" | "personal"
): Promise<KenyaPropertyTaxes> => {
  // This could be a local calculation or API call
  const response = await httpClient.api.post(
    "/kenya-features/calculate-taxes",
    {
      propertyValue,
      isResident,
      purpose,
    }
  );
  return response.data.data;
};

export const getFinancingOptions = async (
  propertyValue: number,
  userProfile?: any
): Promise<KenyaFinancingOptions> => {
  const response = await httpClient.api.post(
    "/kenya-features/financing-options",
    {
      propertyValue,
      userProfile,
    }
  );
  return response.data.data;
};

export const getCountyMarketData = async (county: string): Promise<any> => {
  const response = await httpClient.api.get(
    `/kenya-features/counties/${county}/market-data`
  );
  return response.data.data;
};

// USSD operations
export const getUSSDStats = async (): Promise<any> => {
  const response = await httpClient.api.get("/ussd/stats");
  return response.data.data;
};

export const getUSSDHealth = async (): Promise<any> => {
  const response = await httpClient.api.get("/ussd/health");
  return response.data.data;
};
