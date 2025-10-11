import type { AxiosResponse } from "axios";
import { httpClient } from "@/lib/axios";
import type {
  CallListResponse,
  CreateCallRequest,
  ICallRecording,
  IPropertyTour,
  IVideoCall,
  JoinCallRequest,
  JoinCallResponse,
  PropertyTourRequest,
  RecordingListResponse,
  TourQuestionRequest,
  UserCallListResponse,
  WebRTCTokenResponse,
} from "./video-calling.type";

const BASE_PATH = "/video-calls";

export const videoCallingService = {
  // Call Management
  createCall: async (
    data: CreateCallRequest
  ): Promise<{ data: IVideoCall }> => {
    const response: AxiosResponse<{ data: IVideoCall }> =
      await httpClient.api.post(`${BASE_PATH}`, data);
    return response.data;
  },

  getCall: async (callId: string): Promise<{ data: IVideoCall }> => {
    const response: AxiosResponse<{ data: IVideoCall }> =
      await httpClient.api.get(`${BASE_PATH}/${callId}`);
    return response.data;
  },

  getActiveCalls: async (): Promise<{ data: CallListResponse }> => {
    const response: AxiosResponse<{ data: CallListResponse }> =
      await httpClient.api.get(`${BASE_PATH}/calls/active`);
    return response.data;
  },

  getUserCalls: async (
    userId: string
  ): Promise<{ data: UserCallListResponse }> => {
    const response: AxiosResponse<{ data: UserCallListResponse }> =
      await httpClient.api.get(`${BASE_PATH}/calls/user/${userId}`);
    return response.data;
  },

  joinCall: async (
    data: JoinCallRequest
  ): Promise<{
    data: JoinCallResponse;
  }> => {
    const response: AxiosResponse<{ data: JoinCallResponse }> =
      await httpClient.api.post(
        `${BASE_PATH}/${data.callId}/join`, // calls
        data
      );
    return response.data;
  },

  leaveCall: async (callId: string, participantId: string): Promise<void> => {
    await httpClient.api.post(`${BASE_PATH}/calls/${callId}/leave`, {
      participantId,
    });
  },

  endCall: async (callId: string): Promise<void> => {
    await httpClient.api.post(`${BASE_PATH}/calls/${callId}/end`);
  },

  // WebRTC Token Management
  generateToken: async (
    callId: string
  ): Promise<{ data: WebRTCTokenResponse }> => {
    const response: AxiosResponse<{ data: WebRTCTokenResponse }> =
      await httpClient.api.post(`${BASE_PATH}/${callId}/token`, {
        role: "publisher",
      });
    return response.data;
  },

  // Media Controls
  toggleAudio: async (
    callId: string,
    participantId: string,
    muted: boolean
  ): Promise<void> => {
    await httpClient.api.post(`${BASE_PATH}/calls/${callId}/audio`, {
      participantId,
      muted,
    });
  },

  toggleVideo: async (
    callId: string,
    participantId: string,
    enabled: boolean
  ): Promise<void> => {
    await httpClient.api.post(`${BASE_PATH}/calls/${callId}/video`, {
      participantId,
      enabled,
    });
  },

  toggleScreenShare: async (
    callId: string,
    participantId: string,
    enabled: boolean
  ): Promise<void> => {
    await httpClient.api.post(`${BASE_PATH}/calls/${callId}/screen-share`, {
      participantId,
      enabled,
    });
  },

  // Recording Management
  startRecording: async (callId: string): Promise<ICallRecording> => {
    const response: AxiosResponse<ICallRecording> = await httpClient.api.post(
      `${BASE_PATH}/calls/${callId}/recording/start`
    );
    return response.data;
  },

  stopRecording: async (callId: string): Promise<void> => {
    await httpClient.api.post(`${BASE_PATH}/calls/${callId}/recording/stop`);
  },

  getRecording: async (recordingId: string): Promise<ICallRecording> => {
    const response: AxiosResponse<ICallRecording> = await httpClient.api.get(
      `${BASE_PATH}/recordings/${recordingId}`
    );
    return response.data;
  },

  getCallRecordings: async (callId: string): Promise<RecordingListResponse> => {
    const response: AxiosResponse<RecordingListResponse> =
      await httpClient.api.get(`${BASE_PATH}/calls/${callId}/recordings`);
    return response.data;
  },

  deleteRecording: async (recordingId: string): Promise<void> => {
    await httpClient.api.delete(`${BASE_PATH}/recordings/${recordingId}`);
  },

  // Get all recordings for the current user
  getUserRecordings: async (): Promise<RecordingListResponse> => {
    const response: AxiosResponse<RecordingListResponse> =
      await httpClient.api.get(`${BASE_PATH}/recordings`);
    return response.data;
  },

  // Property Tour Management
  createPropertyTour: async (
    data: PropertyTourRequest
  ): Promise<IPropertyTour> => {
    const response: AxiosResponse<IPropertyTour> = await httpClient.api.post(
      `${BASE_PATH}/tours`,
      data
    );
    return response.data;
  },

  getPropertyTour: async (callId: string): Promise<IPropertyTour> => {
    const response: AxiosResponse<IPropertyTour> = await httpClient.api.get(
      `${BASE_PATH}/tours/${callId}`
    );
    return response.data;
  },

  navigateToStop: async (callId: string, stopIndex: number): Promise<void> => {
    await httpClient.api.post(`${BASE_PATH}/tours/${callId}/navigate`, {
      stopIndex,
    });
  },

  addTourQuestion: async (data: TourQuestionRequest): Promise<void> => {
    await httpClient.api.post(
      `${BASE_PATH}/tours/${data.callId}/questions`,
      data
    );
  },

  // Analytics
  getCallAnalytics: async (callId: string) => {
    const response = await httpClient.api.get(
      `${BASE_PATH}/calls/${callId}/analytics`
    );
    return response.data;
  },

  updateNetworkQuality: async (callId: string, qualityData: any) => {
    await httpClient.api.post(
      `${BASE_PATH}/calls/${callId}/network-quality`,
      qualityData
    );
  },
};
