import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { httpClient } from "@/lib/axios";
import type {
  AnalyticsEvent,
  FormAnalytics,
  UserBehavior,
} from "@/types/analytics.types";

// Analytics API service
const analyticsService = {
  async trackEvent(
    event: Omit<AnalyticsEvent, "timestamp" | "userId">
  ): Promise<void> {
    const response = await httpClient.api.post("/analytics/track-event", {
      ...event,
      timestamp: new Date(),
    });
    return response.data;
  },

  async getFormAnalytics(sessionId: string): Promise<FormAnalytics> {
    const response = await httpClient.api.get(
      `/analytics/form-analytics/${sessionId}`
    );
    return response.data.data;
  },

  async getUserBehavior(): Promise<UserBehavior> {
    const response = await httpClient.api.get("/analytics/user-behavior");
    return response.data.data;
  },

  async getPropertyPerformance(propertyId: string) {
    const response = await httpClient.api.get(
      `/analytics/property-performance/${propertyId}`
    );
    return response.data.data;
  },

  async getFinancialAnalytics(
    timeframe: "month" | "quarter" | "year" = "month"
  ) {
    const response = await httpClient.api.get(
      `/analytics/financial/${timeframe}`
    );
    return response.data.data;
  },

  async getPortfolioAnalytics() {
    const response = await httpClient.api.get("/analytics/portfolio");
    return response.data.data;
  },

  async getDashboardAnalytics() {
    const response = await httpClient.api.get("/analytics/dashboard");
    return response.data.data;
  },

  async getComparativeAnalytics(propertyId: string) {
    const response = await httpClient.api.get(
      `/analytics/comparative/${propertyId}`
    );
    return response.data.data;
  },
};

export function useAnalytics(userId?: string) {
  const sessionId = useRef(crypto.randomUUID());
  const stepStartTime = useRef<Date>(new Date());
  const currentStep = useRef<string>("");

  const trackEventMutation = useMutation({
    mutationFn: analyticsService.trackEvent,
  });

  const getAnalyticsMutation = useMutation({
    mutationFn: analyticsService.getFormAnalytics,
  });

  const getBehaviorMutation = useMutation({
    mutationFn: analyticsService.getUserBehavior,
  });

  const getPropertyPerformanceMutation = useMutation({
    mutationFn: analyticsService.getPropertyPerformance,
  });

  const getFinancialAnalyticsMutation = useMutation({
    mutationFn: analyticsService.getFinancialAnalytics,
  });

  const getPortfolioAnalyticsMutation = useMutation({
    mutationFn: analyticsService.getPortfolioAnalytics,
  });

  const getDashboardAnalyticsMutation = useMutation({
    mutationFn: analyticsService.getDashboardAnalytics,
  });

  const getComparativeAnalyticsMutation = useMutation({
    mutationFn: analyticsService.getComparativeAnalytics,
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

  // Get property performance analytics
  const getPropertyPerformance = useCallback(
    (propertyId: string) =>
      getPropertyPerformanceMutation.mutateAsync(propertyId),
    [getPropertyPerformanceMutation]
  );

  // Get financial analytics
  const getFinancialAnalytics = useCallback(
    (timeframe?: "month" | "quarter" | "year") =>
      getFinancialAnalyticsMutation.mutateAsync(timeframe),
    [getFinancialAnalyticsMutation]
  );

  // Get portfolio analytics
  const getPortfolioAnalytics = useCallback(
    () => getPortfolioAnalyticsMutation.mutateAsync(),
    [getPortfolioAnalyticsMutation]
  );

  // Get dashboard analytics
  const getDashboardAnalytics = useCallback(
    () => getDashboardAnalyticsMutation.mutateAsync(),
    [getDashboardAnalyticsMutation]
  );

  // Get comparative analytics
  const getComparativeAnalytics = useCallback(
    (propertyId: string) =>
      getComparativeAnalyticsMutation.mutateAsync(propertyId),
    [getComparativeAnalyticsMutation]
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
    getPropertyPerformance,
    getFinancialAnalytics,
    getPortfolioAnalytics,
    getDashboardAnalytics,
    getComparativeAnalytics,

    // State
    sessionId: sessionId.current,

    // Loading states
    isTracking: trackEventMutation.isPending,
    isLoadingAnalytics: getAnalyticsMutation.isPending,
    isLoadingBehavior: getBehaviorMutation.isPending,
    isLoadingPropertyPerformance: getPropertyPerformanceMutation.isPending,
    isLoadingFinancialAnalytics: getFinancialAnalyticsMutation.isPending,
    isLoadingPortfolioAnalytics: getPortfolioAnalyticsMutation.isPending,
    isLoadingDashboardAnalytics: getDashboardAnalyticsMutation.isPending,
    isLoadingComparativeAnalytics: getComparativeAnalyticsMutation.isPending,

    // Data
    analytics: getAnalyticsMutation.data,
    behaviorData: getBehaviorMutation.data,
    propertyPerformance: getPropertyPerformanceMutation.data,
    financialAnalytics: getFinancialAnalyticsMutation.data,
    portfolioAnalytics: getPortfolioAnalyticsMutation.data,
    dashboardAnalytics: getDashboardAnalyticsMutation.data,
    comparativeAnalytics: getComparativeAnalyticsMutation.data,

    // Errors
    trackingError: trackEventMutation.error,
    analyticsError: getAnalyticsMutation.error,
    behaviorError: getBehaviorMutation.error,
    propertyPerformanceError: getPropertyPerformanceMutation.error,
    financialAnalyticsError: getFinancialAnalyticsMutation.error,
    portfolioAnalyticsError: getPortfolioAnalyticsMutation.error,
    dashboardAnalyticsError: getDashboardAnalyticsMutation.error,
    comparativeAnalyticsError: getComparativeAnalyticsMutation.error,
  };
}
