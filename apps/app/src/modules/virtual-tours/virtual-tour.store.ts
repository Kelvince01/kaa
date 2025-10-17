/**
 * Virtual Tours Store using Zustand
 */

import { config } from "@kaa/config";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type {
  ChatMessage,
  CollaborationSession,
  LiveAnnotation,
  MLAnalytics,
  Participant,
  TourStatus,
  TourType,
  ViewAngle,
  VirtualTour,
} from "./virtual-tour.type";

type VirtualTourState = {
  // Current tour state
  currentTour: VirtualTour | null;
  currentScene: string | null;
  currentView: ViewAngle;
  isPlaying: boolean;
  isFullscreen: boolean;
  volume: number;

  // Tour list state
  tours: VirtualTour[];
  selectedTours: string[];
  filterBy: {
    status?: TourStatus;
    type?: TourType;
    search?: string;
  };

  // Advanced features state
  advancedMode: boolean;
  aiSuggestions: any[];
  mlAnalytics: MLAnalytics | null;

  // Collaboration state
  collaborationSession: CollaborationSession | null;
  isCollaborating: boolean;
  participants: any[];
  chatMessages: any[];
  liveAnnotations: any[];

  // XR state
  xrMode: "none" | "vr" | "ar";
  xrSupported: boolean;
  xrSession: any | null;

  // Mobile/PWA state
  isMobile: boolean;
  isOffline: boolean;
  offlineTours: string[];
  installPromptAvailable: boolean;

  // Accessibility state
  accessibilityEnabled: boolean;
  textToSpeech: boolean;
  highContrast: boolean;
  keyboardNavigation: boolean;
  voiceControl: boolean;

  // UI state
  showTourControls: boolean;
  showMinimap: boolean;
  showHotspotLabels: boolean;
  showSceneList: boolean;

  // Loading states
  isLoading: boolean;
  isProcessing: boolean;
  uploadProgress: number;
};

type VirtualTourActions = {
  // Tour actions
  setCurrentTour: (tour: VirtualTour | null) => void;
  setCurrentScene: (sceneId: string | null) => void;
  setCurrentView: (view: ViewAngle) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  setVolume: (volume: number) => void;

  // Tour list actions
  setTours: (tours: VirtualTour[]) => void;
  addTour: (tour: VirtualTour) => void;
  updateTour: (tourId: string, updates: Partial<VirtualTour>) => void;
  removeTour: (tourId: string) => void;
  setSelectedTours: (tourIds: string[]) => void;
  setFilterBy: (filters: Partial<VirtualTourState["filterBy"]>) => void;

  // Advanced features actions
  setAdvancedMode: (enabled: boolean) => void;
  setAISuggestions: (suggestions: any[]) => void;
  setMLAnalytics: (analytics: MLAnalytics | null) => void;

  // Collaboration actions
  setCollaborationSession: (session: CollaborationSession | null) => void;
  setIsCollaborating: (collaborating: boolean) => void;
  setParticipants: (participants: Participant[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  addLiveAnnotation: (annotation: LiveAnnotation) => void;

  // XR actions
  setXRMode: (mode: "none" | "vr" | "ar") => void;
  setXRSupported: (supported: boolean) => void;
  setXRSession: (session: any | null) => void;

  // Mobile/PWA actions
  setIsMobile: (mobile: boolean) => void;
  setIsOffline: (offline: boolean) => void;
  setOfflineTours: (tourIds: string[]) => void;
  setInstallPromptAvailable: (available: boolean) => void;

  // Accessibility actions
  setAccessibilityEnabled: (enabled: boolean) => void;
  setTextToSpeech: (enabled: boolean) => void;
  setHighContrast: (enabled: boolean) => void;
  setKeyboardNavigation: (enabled: boolean) => void;
  setVoiceControl: (enabled: boolean) => void;

  // UI actions
  setShowTourControls: (show: boolean) => void;
  setShowMinimap: (show: boolean) => void;
  setShowHotspotLabels: (show: boolean) => void;
  setShowSceneList: (show: boolean) => void;

  // Loading actions
  setIsLoading: (loading: boolean) => void;
  setIsProcessing: (processing: boolean) => void;
  setUploadProgress: (progress: number) => void;

  // Helper actions
  resetTourState: () => void;
  resetCollaborationState: () => void;
  resetXRState: () => void;
  clearFilters: () => void;
};

const initialState: VirtualTourState = {
  // Current tour state
  currentTour: null,
  currentScene: null,
  currentView: { yaw: 0, pitch: 0, fov: 75 },
  isPlaying: false,
  isFullscreen: false,
  volume: 1.0,

  // Tour list state
  tours: [],
  selectedTours: [],
  filterBy: {},

  // Advanced features state
  advancedMode: false,
  aiSuggestions: [],
  mlAnalytics: null,

  // Collaboration state
  collaborationSession: null,
  isCollaborating: false,
  participants: [],
  chatMessages: [],
  liveAnnotations: [],

  // XR state
  xrMode: "none",
  xrSupported: false,
  xrSession: null,

  // Mobile/PWA state
  isMobile: false,
  isOffline: false,
  offlineTours: [],
  installPromptAvailable: false,

  // Accessibility state
  accessibilityEnabled: false,
  textToSpeech: false,
  highContrast: false,
  keyboardNavigation: true,
  voiceControl: false,

  // UI state
  showTourControls: true,
  showMinimap: false,
  showHotspotLabels: true,
  showSceneList: false,

  // Loading states
  isLoading: false,
  isProcessing: false,
  uploadProgress: 0,
};

export const useVirtualTourStore = create<
  VirtualTourState & VirtualTourActions
>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // Tour actions
        setCurrentTour: (tour) => set({ currentTour: tour }),
        setCurrentScene: (sceneId) => set({ currentScene: sceneId }),
        setCurrentView: (view) => set({ currentView: view }),
        setIsPlaying: (playing) => set({ isPlaying: playing }),
        setIsFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
        setVolume: (volume) =>
          set({ volume: Math.max(0, Math.min(1, volume)) }),

        // Tour list actions
        setTours: (tours) => set({ tours }),
        addTour: (tour) => set((state) => ({ tours: [tour, ...state.tours] })),
        updateTour: (tourId, updates) =>
          set((state) => ({
            tours: state.tours.map((tour) =>
              tour.id === tourId ? { ...tour, ...updates } : tour
            ),
            currentTour:
              state.currentTour?.id === tourId
                ? { ...state.currentTour, ...updates }
                : state.currentTour,
          })),
        removeTour: (tourId) =>
          set((state) => ({
            tours: state.tours.filter((tour) => tour.id !== tourId),
            currentTour:
              state.currentTour?.id === tourId ? null : state.currentTour,
          })),
        setSelectedTours: (tourIds) => set({ selectedTours: tourIds }),
        setFilterBy: (filters) =>
          set((state) => ({ filterBy: { ...state.filterBy, ...filters } })),

        // Advanced features actions
        setAdvancedMode: (enabled) => set({ advancedMode: enabled }),
        setAISuggestions: (suggestions) => set({ aiSuggestions: suggestions }),
        setMLAnalytics: (analytics) => set({ mlAnalytics: analytics }),

        // Collaboration actions
        setCollaborationSession: (session) =>
          set({ collaborationSession: session }),
        setIsCollaborating: (collaborating) =>
          set({ isCollaborating: collaborating }),
        setParticipants: (participants) => set({ participants }),
        addChatMessage: (message) =>
          set((state) => ({ chatMessages: [...state.chatMessages, message] })),
        addLiveAnnotation: (annotation) =>
          set((state) => ({
            liveAnnotations: [...state.liveAnnotations, annotation],
          })),

        // XR actions
        setXRMode: (mode) => set({ xrMode: mode }),
        setXRSupported: (supported) => set({ xrSupported: supported }),
        setXRSession: (session) => set({ xrSession: session }),

        // Mobile/PWA actions
        setIsMobile: (mobile) => set({ isMobile: mobile }),
        setIsOffline: (offline) => set({ isOffline: offline }),
        setOfflineTours: (tourIds) => set({ offlineTours: tourIds }),
        setInstallPromptAvailable: (available) =>
          set({ installPromptAvailable: available }),

        // Accessibility actions
        setAccessibilityEnabled: (enabled) =>
          set({ accessibilityEnabled: enabled }),
        setTextToSpeech: (enabled) => set({ textToSpeech: enabled }),
        setHighContrast: (enabled) => set({ highContrast: enabled }),
        setKeyboardNavigation: (enabled) =>
          set({ keyboardNavigation: enabled }),
        setVoiceControl: (enabled) => set({ voiceControl: enabled }),

        // UI actions
        setShowTourControls: (show) => set({ showTourControls: show }),
        setShowMinimap: (show) => set({ showMinimap: show }),
        setShowHotspotLabels: (show) => set({ showHotspotLabels: show }),
        setShowSceneList: (show) => set({ showSceneList: show }),

        // Loading actions
        setIsLoading: (loading) => set({ isLoading: loading }),
        setIsProcessing: (processing) => set({ isProcessing: processing }),
        setUploadProgress: (progress) => set({ uploadProgress: progress }),

        // Helper actions
        resetTourState: () =>
          set({
            currentTour: null,
            currentScene: null,
            currentView: { yaw: 0, pitch: 0, fov: 75 },
            isPlaying: false,
            isFullscreen: false,
          }),
        resetCollaborationState: () =>
          set({
            collaborationSession: null,
            isCollaborating: false,
            participants: [],
            chatMessages: [],
            liveAnnotations: [],
          }),
        resetXRState: () =>
          set({
            xrMode: "none",
            xrSession: null,
          }),
        clearFilters: () => set({ filterBy: {} }),
      }),
      {
        name: `${config.slug}-virtual-tour-store`,
        partialize: (state) => ({
          // Only persist certain state
          advancedMode: state.advancedMode,
          filterBy: state.filterBy,
          accessibilityEnabled: state.accessibilityEnabled,
          textToSpeech: state.textToSpeech,
          highContrast: state.highContrast,
          keyboardNavigation: state.keyboardNavigation,
          voiceControl: state.voiceControl,
          showTourControls: state.showTourControls,
          showMinimap: state.showMinimap,
          showHotspotLabels: state.showHotspotLabels,
          volume: state.volume,
          offlineTours: state.offlineTours,
        }),
      }
    ),
    { name: "VirtualTourStore" }
  )
);

// Selectors for computed values
export const useVirtualTourSelectors = () =>
  useVirtualTourStore(
    useShallow((state) => ({
      // Computed values
      hasCurrentTour: !!state.currentTour,
      currentSceneData: state.currentTour?.scenes.find(
        (s) => s.id === state.currentScene
      ),
      tourProgress: state.currentTour?.scenes.length
        ? ((state.currentTour.scenes.findIndex(
            (s) => s.id === state.currentScene
          ) +
            1) /
            state.currentTour.scenes.length) *
          100
        : 0,
      filteredTours: state.tours.filter((tour) => {
        if (state.filterBy.status && tour.status !== state.filterBy.status)
          return false;
        if (state.filterBy.type && tour.type !== state.filterBy.type)
          return false;
        if (
          state.filterBy.search &&
          !tour.title
            .toLowerCase()
            .includes(state.filterBy.search.toLowerCase())
        )
          return false;
        return true;
      }),
      isAdvancedFeatureAvailable: (_feature: string) => {
        // Check if specific advanced feature is available
        return state.advancedMode; // Simplified check
      },
      collaborationInfo: {
        isHost: state.collaborationSession?.role === "host",
        canEdit:
          state.collaborationSession?.role === "host" ||
          state.collaborationSession?.role === "editor",
        participantCount: state.participants.length,
      },
      xrInfo: {
        canStartVR: state.xrSupported && state.xrMode === "none",
        canStartAR: state.xrSupported && state.xrMode === "none",
        isInXR: state.xrMode !== "none",
      },
      accessibilityInfo: {
        isFullyAccessible:
          state.accessibilityEnabled && state.keyboardNavigation,
        hasVoiceSupport: state.voiceControl,
        hasScreenReaderSupport: state.textToSpeech,
      },
    }))
  );

// Action creators for complex operations
export const useVirtualTourActions = () => {
  const store = useVirtualTourStore();

  return {
    // Navigation actions
    nextScene: () => {
      const { currentTour, currentScene } = store;
      if (!(currentTour && currentScene)) return;

      const currentIndex = currentTour.scenes.findIndex(
        (s) => s.id === currentScene
      );
      const nextIndex = (currentIndex + 1) % currentTour.scenes.length;
      const nextScene = currentTour.scenes[nextIndex];

      if (nextScene) {
        store.setCurrentScene(nextScene.id);
      }
    },

    previousScene: () => {
      const { currentTour, currentScene } = store;
      if (!(currentTour && currentScene)) return;

      const currentIndex = currentTour.scenes.findIndex(
        (s) => s.id === currentScene
      );
      const prevIndex =
        currentIndex > 0 ? currentIndex - 1 : currentTour.scenes.length - 1;
      const prevScene = currentTour.scenes[prevIndex];

      if (prevScene) {
        store.setCurrentScene(prevScene.id);
      }
    },

    goToScene: (sceneId: string) => {
      store.setCurrentScene(sceneId);
    },

    // Playback actions
    togglePlayPause: () => {
      store.setIsPlaying(!store.isPlaying);
    },

    toggleFullscreen: () => {
      store.setIsFullscreen(!store.isFullscreen);
    },

    adjustVolume: (delta: number) => {
      const newVolume = Math.max(0, Math.min(1, store.volume + delta));
      store.setVolume(newVolume);
    },

    // Advanced features actions
    toggleAdvancedMode: () => {
      store.setAdvancedMode(!store.advancedMode);
    },

    // Collaboration actions
    startCollaboration: (session: CollaborationSession) => {
      store.setCollaborationSession(session);
      store.setIsCollaborating(true);
    },

    endCollaboration: () => {
      store.setCollaborationSession(null);
      store.setIsCollaborating(false);
      store.setParticipants([]);
      // Don't clear chat history - user might want to review
    },

    // XR actions
    enterXR: (mode: "vr" | "ar", session: any) => {
      store.setXRMode(mode);
      store.setXRSession(session);
    },

    exitXR: () => {
      store.setXRMode("none");
      store.setXRSession(null);
    },

    // Accessibility actions
    toggleAccessibility: () => {
      store.setAccessibilityEnabled(!store.accessibilityEnabled);
    },

    toggleTextToSpeech: () => {
      store.setTextToSpeech(!store.textToSpeech);
    },

    toggleHighContrast: () => {
      store.setHighContrast(!store.highContrast);
    },

    toggleVoiceControl: () => {
      store.setVoiceControl(!store.voiceControl);
    },

    // UI actions
    toggleControls: () => {
      store.setShowTourControls(!store.showTourControls);
    },

    toggleMinimap: () => {
      store.setShowMinimap(!store.showMinimap);
    },

    // Bulk actions
    selectAllTours: () => {
      const allTourIds = store.tours.map((t) => t.id);
      store.setSelectedTours(allTourIds);
    },

    deselectAllTours: () => {
      store.setSelectedTours([]);
    },

    // State management
    resetAllState: () => {
      // Reset to initial state but keep user preferences
      const userPreferences = {
        accessibilityEnabled: store.accessibilityEnabled,
        textToSpeech: store.textToSpeech,
        highContrast: store.highContrast,
        keyboardNavigation: store.keyboardNavigation,
        voiceControl: store.voiceControl,
        volume: store.volume,
      };

      // Reset each state section individually
      store.resetTourState();
      store.resetCollaborationState();
      store.resetXRState();
      store.clearFilters();

      // Reset other states while preserving user preferences
      store.setTours([]);
      store.setSelectedTours([]);
      store.setAdvancedMode(false);
      store.setAISuggestions([]);
      store.setMLAnalytics(null);
      store.setParticipants([]);
      // store.setChatMessages([]);
      // store.setLiveAnnotations([]);
      store.setXRSupported(false);
      store.setIsMobile(false);
      store.setIsOffline(false);
      store.setOfflineTours([]);
      store.setInstallPromptAvailable(false);
      store.setShowTourControls(true);
      store.setShowMinimap(false);
      store.setShowHotspotLabels(true);
      store.setShowSceneList(false);
      store.setIsLoading(false);
      store.setIsProcessing(false);
      store.setUploadProgress(0);

      // Restore user preferences
      store.setAccessibilityEnabled(userPreferences.accessibilityEnabled);
      store.setTextToSpeech(userPreferences.textToSpeech);
      store.setHighContrast(userPreferences.highContrast);
      store.setKeyboardNavigation(userPreferences.keyboardNavigation);
      store.setVoiceControl(userPreferences.voiceControl);
      store.setVolume(userPreferences.volume);
    },
  };
};

// Hook for accessing both state and actions
export const useVirtualTourState = () => {
  const state = useVirtualTourStore();
  const selectors = useVirtualTourSelectors();
  const actions = useVirtualTourActions();

  return {
    ...state,
    ...selectors,
    ...actions,
  };
};
