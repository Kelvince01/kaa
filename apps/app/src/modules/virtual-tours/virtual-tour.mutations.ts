/**
 * Virtual Tours Mutations using TanStack Query
 */

import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addHotspot,
  addScene,
  createCollaborationSession,
  createVirtualTour,
  deleteHotspot,
  deleteScene,
  deleteVirtualTour,
  disableAdvancedMode,
  duplicateVirtualTour,
  enableAdvancedMode,
  enableVoiceControl,
  endCollaborationSession,
  generateSmartConnections,
  processVirtualTourPayment,
  publishVirtualTour,
  restartAdvancedService,
  startXRSession,
  trackHotspotInteraction,
  trackSceneView,
  trackTourView,
  updateHotspot,
  updateScene,
  updateVirtualTour,
  uploadMedia,
} from "./virtual-tour.service";
import type {
  CreateTourFormData,
  HotspotFormData,
  SceneFormData,
  VirtualTour,
} from "./virtual-tour.type";

// Tour CRUD mutations
export const useCreateVirtualTour = (
  options?: UseMutationOptions<VirtualTour, Error, CreateTourFormData>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVirtualTour,
    onSuccess: (data, variables) => {
      toast.success("Virtual tour created successfully");

      // Invalidate property tours
      queryClient
        .invalidateQueries({
          queryKey: ["virtual-tours", variables.propertyId],
        })
        .then((_) => null);

      // Add to cache
      queryClient.setQueryData(["virtual-tour", data.id], data);
    },
    onError: (error) => {
      toast.error(`Failed to create virtual tour: ${error.message}`);
    },
    ...options,
  });
};

export const useUpdateVirtualTour = (
  options?: UseMutationOptions<
    VirtualTour,
    Error,
    { tourId: string; updates: Partial<VirtualTour> }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tourId, updates }) => updateVirtualTour(tourId, updates),
    onSuccess: (data, variables) => {
      toast.success("Virtual tour updated successfully");

      // Update cache
      queryClient.setQueryData(["virtual-tour", variables.tourId], data);

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["virtual-tours", data.propertyId],
      });
    },
    onError: (error) => {
      toast.error(`Failed to update virtual tour: ${error.message}`);
    },
    ...options,
  });
};

export const useDeleteVirtualTour = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteVirtualTour,
    onSuccess: (_, tourId) => {
      toast.success("Virtual tour deleted successfully");

      // Remove from cache
      queryClient.removeQueries({ queryKey: ["virtual-tour", tourId] });

      // Invalidate tours list
      queryClient.invalidateQueries({
        queryKey: ["virtual-tours"],
      });
    },
    onError: (error) => {
      toast.error(`Failed to delete virtual tour: ${error.message}`);
    },
    ...options,
  });
};

export const usePublishVirtualTour = (
  options?: UseMutationOptions<VirtualTour, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishVirtualTour,
    onSuccess: (data, tourId) => {
      toast.success("Virtual tour published successfully");

      // Update cache
      queryClient.setQueryData(["virtual-tour", tourId], data);

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["virtual-tours", data.propertyId],
      });
    },
    onError: (error) => {
      toast.error(`Failed to publish virtual tour: ${error.message}`);
    },
    ...options,
  });
};

export const useDuplicateVirtualTour = (
  options?: UseMutationOptions<
    VirtualTour,
    Error,
    { tourId: string; title?: string }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tourId, title }) => duplicateVirtualTour(tourId, title),
    onSuccess: (data, _variables) => {
      toast.success("Virtual tour duplicated successfully");

      // Add to cache
      queryClient.setQueryData(["virtual-tour", data.id], data);

      // Invalidate tours list
      queryClient.invalidateQueries({
        queryKey: ["virtual-tours", data.propertyId],
      });
    },
    onError: (error) => {
      toast.error(`Failed to duplicate virtual tour: ${error.message}`);
    },
    ...options,
  });
};

// Scene mutations
export const useAddScene = (
  options?: UseMutationOptions<
    any,
    Error,
    { tourId: string; sceneData: SceneFormData }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tourId, sceneData }) => addScene(tourId, sceneData),
    onSuccess: (_data, variables) => {
      toast.success("Scene added successfully");

      // Invalidate tour data
      queryClient.invalidateQueries({
        queryKey: ["virtual-tour", variables.tourId],
      });
    },
    onError: (error) => {
      toast.error(`Failed to add scene: ${error.message}`);
    },
    ...options,
  });
};

export const useUpdateScene = (
  options?: UseMutationOptions<
    any,
    Error,
    { tourId: string; sceneId: string; updates: Partial<SceneFormData> }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tourId, sceneId, updates }) =>
      updateScene(tourId, sceneId, updates),
    onSuccess: async (_data, variables) => {
      toast.success("Scene updated successfully");

      // Invalidate tour data
      await queryClient.invalidateQueries({
        queryKey: ["virtual-tour", variables.tourId],
      });
    },
    onError: (error) => {
      toast.error(`Failed to update scene: ${error.message}`);
    },
    ...options,
  });
};

export const useDeleteScene = (
  options?: UseMutationOptions<void, Error, { tourId: string; sceneId: string }>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tourId, sceneId }) => deleteScene(tourId, sceneId),
    onSuccess: async (_, variables) => {
      toast.success("Scene deleted successfully");

      // Invalidate tour data
      await queryClient.invalidateQueries({
        queryKey: ["virtual-tour", variables.tourId],
      });
    },
    onError: (error) => {
      toast.error(`Failed to delete scene: ${error.message}`);
    },
    ...options,
  });
};

// Hotspot mutations
export const useAddHotspot = (
  options?: UseMutationOptions<
    any,
    Error,
    { tourId: string; sceneId: string; hotspotData: HotspotFormData }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tourId, sceneId, hotspotData }) =>
      addHotspot(tourId, sceneId, hotspotData),
    onSuccess: async (_data, variables) => {
      toast.success("Hotspot added successfully");

      // Invalidate tour data
      await queryClient.invalidateQueries({
        queryKey: ["virtual-tour", variables.tourId],
      });
    },
    onError: (error) => {
      toast.error(`Failed to add hotspot: ${error.message}`);
    },
    ...options,
  });
};

export const useUpdateHotspot = (
  options?: UseMutationOptions<
    any,
    Error,
    { tourId: string; hotspotId: string; updates: Partial<HotspotFormData> }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tourId, hotspotId, updates }) =>
      updateHotspot(tourId, hotspotId, updates),
    onSuccess: (_data, variables) => {
      toast.success("Hotspot updated successfully");

      // Invalidate tour data
      queryClient.invalidateQueries({
        queryKey: ["virtual-tour", variables.tourId],
      });
    },
    onError: (error) => {
      toast.error(`Failed to update hotspot: ${error.message}`);
    },
    ...options,
  });
};

export const useDeleteHotspot = (
  options?: UseMutationOptions<
    void,
    Error,
    { tourId: string; hotspotId: string }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tourId, hotspotId }) => deleteHotspot(tourId, hotspotId),
    onSuccess: (_, variables) => {
      toast.success("Hotspot deleted successfully");

      // Invalidate tour data
      queryClient.invalidateQueries({
        queryKey: ["virtual-tour", variables.tourId],
      });
    },
    onError: (error) => {
      toast.error(`Failed to delete hotspot: ${error.message}`);
    },
    ...options,
  });
};

// Media mutations
export const useUploadMedia = (
  options?: UseMutationOptions<
    string,
    Error,
    {
      tourId: string;
      file: File;
      sceneId?: string;
      metadata?: Record<string, any>;
    }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tourId, file, sceneId, metadata }) =>
      uploadMedia(tourId, file, sceneId, metadata),
    onSuccess: (_mediaUrl, variables) => {
      toast.success("Media uploaded successfully");

      // Invalidate tour data if scene specified
      if (variables.sceneId) {
        queryClient.invalidateQueries({
          queryKey: ["virtual-tour", variables.tourId],
        });
      }
    },
    onError: (error) => {
      toast.error(`Failed to upload media: ${error.message}`);
    },
    ...options,
  });
};

// Advanced feature mutations
export const useEnableAdvancedMode = (
  options?: UseMutationOptions<void, Error, void>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enableAdvancedMode,
    onSuccess: () => {
      toast.success("Advanced mode enabled successfully");

      // Invalidate capabilities
      queryClient.invalidateQueries({
        queryKey: ["service-capabilities"],
      });
    },
    onError: (error) => {
      toast.error(`Failed to enable advanced mode: ${error.message}`);
    },
    ...options,
  });
};

export const useDisableAdvancedMode = (
  options?: UseMutationOptions<void, Error, void>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disableAdvancedMode,
    onSuccess: () => {
      toast.success("Advanced mode disabled successfully");

      // Invalidate capabilities
      queryClient.invalidateQueries({
        queryKey: ["service-capabilities"],
      });
    },
    onError: (error) => {
      toast.error(`Failed to disable advanced mode: ${error.message}`);
    },
    ...options,
  });
};

export const useStartXRSession = (
  options?: UseMutationOptions<
    void,
    Error,
    { tourId: string; mode: "vr" | "ar"; settings: any }
  >
) =>
  useMutation({
    mutationFn: ({ tourId, mode, settings }) =>
      startXRSession(tourId, mode, settings),
    onSuccess: (_, variables) => {
      toast.success(
        `${variables.mode.toUpperCase()} session started successfully`
      );
    },
    onError: (error) => {
      toast.error(`Failed to start XR session: ${error.message}`);
    },
    ...options,
  });

export const useGenerateSmartConnections = (
  options?: UseMutationOptions<any, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateSmartConnections,
    onSuccess: (data, tourId) => {
      toast.success(`Generated ${data.applied} smart connections`);

      // Invalidate tour data
      queryClient.invalidateQueries({
        queryKey: ["virtual-tour", tourId],
      });
    },
    onError: (error) => {
      toast.error(`Failed to generate smart connections: ${error.message}`);
    },
    ...options,
  });
};

export const useEnableVoiceControl = (
  options?: UseMutationOptions<
    void,
    Error,
    { tourId: string; platform: "alexa" | "google" }
  >
) =>
  useMutation({
    mutationFn: ({ tourId, platform }) => enableVoiceControl(tourId, platform),
    onSuccess: (_, variables) => {
      toast.success(`${variables.platform} voice control enabled successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to enable voice control: ${error.message}`);
    },
    ...options,
  });

export const useRestartAdvancedService = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restartAdvancedService,
    onSuccess: (_, serviceName) => {
      toast.success(`${serviceName} service restarted successfully`);

      // Invalidate health queries
      queryClient.invalidateQueries({
        queryKey: ["advanced-services-health"],
      });
      queryClient.invalidateQueries({
        queryKey: ["service-capabilities"],
      });
    },
    onError: (error, serviceName) => {
      toast.error(`Failed to restart ${serviceName}: ${error.message}`);
    },
    ...options,
  });
};

// Collaboration mutations
export const useCreateCollaborationSession = (
  options?: UseMutationOptions<any, Error, string>
) =>
  useMutation({
    mutationFn: createCollaborationSession,
    onSuccess: (_data, _tourId) => {
      toast.success("Collaboration session created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create collaboration session: ${error.message}`);
    },
    ...options,
  });

export const useEndCollaborationSession = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: endCollaborationSession,
    onSuccess: (_, sessionId) => {
      toast.success("Collaboration session ended successfully");

      // Remove session from cache
      queryClient.removeQueries({
        queryKey: ["collaboration-session", sessionId],
      });
    },
    onError: (error) => {
      toast.error(`Failed to end collaboration session: ${error.message}`);
    },
    ...options,
  });
};

// Payment mutations
export const useProcessTourPayment = (
  options?: UseMutationOptions<
    any,
    Error,
    {
      tourId: string;
      amount: number;
      provider: "mpesa" | "airtel_money";
      phoneNumber: string;
      reference: string;
      description: string;
    }
  >
) =>
  useMutation({
    mutationFn: processVirtualTourPayment,
    onSuccess: (_data, variables) => {
      toast.success(
        `${variables.provider === "mpesa" ? "M-Pesa" : "Airtel Money"} payment initiated successfully`
      );
    },
    onError: (error, variables) => {
      toast.error(
        `${variables.provider === "mpesa" ? "M-Pesa" : "Airtel Money"} payment failed: ${error.message}`
      );
    },
    ...options,
  });

// Tracking mutations (usually silent)
export const useTrackTourView = (
  options?: UseMutationOptions<void, Error, { tourId: string; metadata: any }>
) => {
  return useMutation({
    mutationFn: ({ tourId, metadata }) => trackTourView(tourId, metadata),
    // Silent tracking - no toast notifications
    ...options,
  });
};

export const useTrackSceneView = (
  options?: UseMutationOptions<
    void,
    Error,
    { tourId: string; sceneId: string; sessionId: string; duration: number }
  >
) => {
  return useMutation({
    mutationFn: ({ tourId, sceneId, sessionId, duration }) =>
      trackSceneView(tourId, sceneId, sessionId, duration),
    // Silent tracking - no toast notifications
    ...options,
  });
};

export const useTrackHotspotInteraction = (
  options?: UseMutationOptions<
    void,
    Error,
    { tourId: string; hotspotId: string; interactionType: "view" | "click" }
  >
) => {
  return useMutation({
    mutationFn: ({ tourId, hotspotId, interactionType }) =>
      trackHotspotInteraction(tourId, hotspotId, interactionType),
    // Silent tracking - no toast notifications
    ...options,
  });
};
