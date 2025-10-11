import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CallQuality,
  ConnectionState,
  ICallParticipant,
  IVideoCall,
} from "./video-calling.type";

type LocalMediaState = {
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenShareEnabled: boolean;
  audioDeviceId?: string;
  videoDeviceId?: string;
  audioOutputDeviceId?: string;
};

type CallState = {
  currentCall: IVideoCall | null;
  localParticipant: ICallParticipant | null;
  localMediaState: LocalMediaState;
  connectionState: ConnectionState;
  networkQuality: CallQuality;
  isConnecting: boolean;
  error: string | null;
};

type CallActions = {
  setCurrentCall: (call: IVideoCall | null) => void;
  setLocalParticipant: (participant: ICallParticipant | null) => void;
  updateLocalMediaState: (state: Partial<LocalMediaState>) => void;
  setConnectionState: (state: ConnectionState) => void;
  setNetworkQuality: (quality: CallQuality) => void;
  setIsConnecting: (isConnecting: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
};

const initialState: CallState = {
  currentCall: null,
  localParticipant: null,
  localMediaState: {
    audioEnabled: true,
    videoEnabled: true,
    screenShareEnabled: false,
  },
  connectionState: "new" as ConnectionState,
  networkQuality: "good" as CallQuality,
  isConnecting: false,
  error: null,
};

export const useVideoCallingStore = create<CallState & CallActions>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentCall: (call) => set({ currentCall: call }),

      setLocalParticipant: (participant) =>
        set({ localParticipant: participant }),

      updateLocalMediaState: (state) =>
        set((prev) => ({
          localMediaState: { ...prev.localMediaState, ...state },
        })),

      setConnectionState: (connectionState) => set({ connectionState }),

      setNetworkQuality: (networkQuality) => set({ networkQuality }),

      setIsConnecting: (isConnecting) => set({ isConnecting }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    {
      name: "video-calling-store",
      partialize: (state) => ({
        localMediaState: state.localMediaState,
      }),
    }
  )
);
