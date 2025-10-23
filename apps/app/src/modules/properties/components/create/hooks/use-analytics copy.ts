import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

type AnalyticsEvent = {
  event: string;
  step?: string;
  field?: string;
  value?: any;
  timestamp: Date;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
};

type FormAnalytics = {
  sessionId: string;
  startTime: Date;
  currentStep: string;
  timePerStep: Record<string, number>;
  fieldInteractions: Record<string, number>;
  errors: Array<{ field: string; error: string; timestamp: Date }>;
  completionRate: number;
  dropOffPoints: string[];
};

type UserBehavior = {
  averageTimePerStep: number;
  mostProblematicFields: Array<{ field: string; errorRate: number }>;
  commonDropOffPoints: string[];
  conversionFunnels: Record<string, number>;
  deviceType: "mobile" | "tablet" | "desktop";
  browserInfo: string;
};

// Mock analytics service
const mockAnalyticsService = {
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    // In real implementation, this would send to analytics service
    console.log("Analytics Event:", event);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 100));
  },

  async getFormAnalytics(sessionId: string): Promise<FormAnalytics> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      sessionId,
      startTime: new Date(Date.now() - 1_800_000), // 30 min ago
      currentStep: "general",
      timePerStep: {
        general: 180,
        media: 240,
        location: 120,
        details: 90,
        pricing: 150,
      },
      fieldInteractions: {
        "general.title": 5,
        "general.description": 8,
        "location.county": 2,
        "pricing.rentAmount": 3,
      },
      errors: [
        {
          field: "general.title",
          error: "Title too short",
          timestamp: new Date(Date.now() - 600_000),
        },
        {
          field: "pricing.rentAmount",
          error: "Invalid amount",
          timestamp: new Date(Date.now() - 300_000),
        },
      ],
      completionRate: 0.6,
      dropOffPoints: ["media", "pricing"],
    };
  },

  async getUserBehavior(): Promise<UserBehavior> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const userAgent = navigator.userAgent;
    let deviceType: "mobile" | "tablet" | "desktop" = "desktop";

    // biome-ignore lint/performance/useTopLevelRegex: ignore
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      // biome-ignore lint/performance/useTopLevelRegex: ignore
      deviceType = /iPad|Android(?!.*Mobile)/.test(userAgent)
        ? "tablet"
        : "mobile";
    }

    return {
      averageTimePerStep: 165,
      mostProblematicFields: [
        { field: "general.description", errorRate: 0.23 },
        { field: "pricing.rentAmount", errorRate: 0.18 },
        { field: "location.address", errorRate: 0.15 },
      ],
      commonDropOffPoints: ["media", "pricing", "details"],
      conversionFunnels: {
        general: 1.0,
        media: 0.85,
        location: 0.78,
        details: 0.72,
        pricing: 0.65,
        completed: 0.58,
      },
      deviceType,
      browserInfo: userAgent,
    };
  },
};

export function useAnalytics(userId?: string) {
  const sessionId = useRef(crypto.randomUUID());
  const stepStartTime = useRef<Date>(new Date());
  const currentStep = useRef<string>("");

  const trackEventMutation = useMutation({
    mutationFn: mockAnalyticsService.trackEvent,
  });

  const getAnalyticsMutation = useMutation({
    mutationFn: mockAnalyticsService.getFormAnalytics,
  });

  const getBehaviorMutation = useMutation({
    mutationFn: mockAnalyticsService.getUserBehavior,
  });

  // Track form events
  const trackEvent = useCallback(
    (event: string, metadata?: Record<string, any>) => {
      const analyticsEvent: AnalyticsEvent = {
        event,
        timestamp: new Date(),
        sessionId: sessionId.current,
        userId,
        metadata,
      };

      trackEventMutation.mutate(analyticsEvent);
    },
    [userId, trackEventMutation]
  );

  // Track step changes
  const trackStepChange = useCallback(
    (newStep: string, oldStep?: string) => {
      const now = new Date();

      if (oldStep && currentStep.current === oldStep) {
        const timeSpent = now.getTime() - stepStartTime.current.getTime();

        trackEvent("step_completed", {
          step: oldStep,
          timeSpent: Math.round(timeSpent / 1000), // seconds
          nextStep: newStep,
        });
      }

      trackEvent("step_started", { step: newStep });

      currentStep.current = newStep;
      stepStartTime.current = now;
    },
    [trackEvent]
  );

  // Track field interactions
  const trackFieldInteraction = useCallback(
    (field: string, action: "focus" | "blur" | "change", value?: any) => {
      trackEvent("field_interaction", {
        field,
        action,
        value: typeof value === "string" ? value.substring(0, 100) : value, // Truncate long values
        step: currentStep.current,
      });
    },
    [trackEvent]
  );

  // Track form errors
  const trackError = useCallback(
    (field: string, error: string) => {
      trackEvent("form_error", {
        field,
        error,
        step: currentStep.current,
      });
    },
    [trackEvent]
  );

  // Track validation warnings
  const trackWarning = useCallback(
    (field: string, warning: string) => {
      trackEvent("form_warning", {
        field,
        warning,
        step: currentStep.current,
      });
    },
    [trackEvent]
  );

  // Track AI assistant usage
  const trackAIUsage = useCallback(
    (feature: string, success: boolean, metadata?: Record<string, any>) => {
      trackEvent("ai_assistant_used", {
        feature,
        success,
        step: currentStep.current,
        ...metadata,
      });
    },
    [trackEvent]
  );

  // Track media uploads
  const trackMediaUpload = useCallback(
    (type: "image" | "video", count: number, totalSize: number) => {
      trackEvent("media_upload", {
        type,
        count,
        totalSize,
        step: currentStep.current,
      });
    },
    [trackEvent]
  );

  // Track auto-save events
  const trackAutoSave = useCallback(
    (success: boolean, dataSize?: number) => {
      trackEvent("auto_save", {
        success,
        dataSize,
        step: currentStep.current,
      });
    },
    [trackEvent]
  );

  // Track form completion
  const trackCompletion = useCallback(() => {
    const sessionDuration = Date.now() - stepStartTime.current.getTime();

    trackEvent("form_completed", {
      sessionDuration: Math.round(sessionDuration / 1000),
      totalSteps: 5,
    });
  }, [trackEvent]);

  // Track drop-off
  const trackDropOff = useCallback(
    (reason?: string) => {
      const sessionDuration = Date.now() - stepStartTime.current.getTime();

      trackEvent("form_dropped_off", {
        step: currentStep.current,
        sessionDuration: Math.round(sessionDuration / 1000),
        reason,
      });
    },
    [trackEvent]
  );

  // Track performance metrics
  const trackPerformance = useCallback(
    (metric: string, value: number, unit: "ms" | "bytes" | "count") => {
      trackEvent("performance_metric", {
        metric,
        value,
        unit,
        step: currentStep.current,
      });
    },
    [trackEvent]
  );

  // Get analytics data
  const getAnalytics = useCallback(
    () => getAnalyticsMutation.mutateAsync(sessionId.current),
    [getAnalyticsMutation]
  );

  const getBehaviorData = useCallback(
    () => getBehaviorMutation.mutateAsync(),
    [getBehaviorMutation]
  );

  // Set up beforeunload tracking
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackDropOff("page_unload");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [trackDropOff]);

  // Track session start
  useEffect(() => {
    trackEvent("session_started", {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      referrer: document.referrer,
    });
  }, [trackEvent]);

  return {
    // Core tracking functions
    trackEvent,
    trackStepChange,
    trackFieldInteraction,
    trackError,
    trackWarning,
    trackAIUsage,
    trackMediaUpload,
    trackAutoSave,
    trackCompletion,
    trackDropOff,
    trackPerformance,

    // Data retrieval
    getAnalytics,
    getBehaviorData,

    // State
    sessionId: sessionId.current,

    // Loading states
    isTracking: trackEventMutation.isPending,
    isLoadingAnalytics: getAnalyticsMutation.isPending,
    isLoadingBehavior: getBehaviorMutation.isPending,

    // Data
    analytics: getAnalyticsMutation.data,
    behaviorData: getBehaviorMutation.data,
  };
}
