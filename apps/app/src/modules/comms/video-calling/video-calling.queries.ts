"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryClient } from "@/query/query-client";
import { videoCallingService } from "./video-calling.service";
import type {
  CreateCallRequest,
  JoinCallRequest,
  PropertyTourRequest,
  TourQuestionRequest,
} from "./video-calling.type";

export const videoCallingKeys = {
  all: ["video-calling"] as const,
  calls: () => [...videoCallingKeys.all, "calls"] as const,
  call: (callId: string) => [...videoCallingKeys.calls(), callId] as const,
  activeCalls: () => [...videoCallingKeys.calls(), "active"] as const,
  userCalls: (userId: string) =>
    [...videoCallingKeys.calls(), "user", userId] as const,
  recordings: () => [...videoCallingKeys.all, "recordings"] as const,
  recording: (recordingId: string) =>
    [...videoCallingKeys.recordings(), recordingId] as const,
  callRecordings: (callId: string) =>
    [...videoCallingKeys.recordings(), "call", callId] as const,
  tours: () => [...videoCallingKeys.all, "tours"] as const,
  tour: (callId: string) => [...videoCallingKeys.tours(), callId] as const,
  analytics: (callId: string) =>
    [...videoCallingKeys.all, "analytics", callId] as const,
  token: (callId: string) =>
    [...videoCallingKeys.all, "token", callId] as const,
} as const;

// Call Management Queries
export const useCreateCall = () =>
  useMutation({
    mutationFn: (data: CreateCallRequest) =>
      videoCallingService.createCall(data),
    onSuccess: (call) => {
      queryClient.invalidateQueries({ queryKey: videoCallingKeys.calls() });
      toast.success("Call created successfully");
      return call;
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to create call";
      toast.error(message);
    },
  });

export const useCall = (callId: string, enabled = true) =>
  useQuery({
    queryKey: videoCallingKeys.call(callId),
    queryFn: () => videoCallingService.getCall(callId),
    enabled: enabled && !!callId,
    refetchInterval: 5000, // Refetch every 5 seconds for live updates
  });

export const useActiveCalls = () =>
  useQuery({
    queryKey: videoCallingKeys.activeCalls(),
    queryFn: () => videoCallingService.getActiveCalls(),
    refetchInterval: 10_000, // Refetch every 10 seconds
  });

export const useUserCalls = (userId: string, enabled = true) =>
  useQuery({
    queryKey: videoCallingKeys.userCalls(userId),
    queryFn: () => videoCallingService.getUserCalls(userId),
    enabled: enabled && !!userId,
  });

export const useJoinCall = () =>
  useMutation({
    mutationFn: (data: JoinCallRequest) => videoCallingService.joinCall(data),
    onSuccess: (call) => {
      queryClient.invalidateQueries({
        queryKey: videoCallingKeys.call(call.data.callId),
      });
      toast.success("Joined call successfully");
      return call;
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to join call";
      toast.error(message);
    },
  });

export const useLeaveCall = () =>
  useMutation({
    mutationFn: ({
      callId,
      participantId,
    }: {
      callId: string;
      participantId: string;
    }) => videoCallingService.leaveCall(callId, participantId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: videoCallingKeys.call(variables.callId),
      });
      toast.success("Left call");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to leave call";
      toast.error(message);
    },
  });

export const useEndCall = () =>
  useMutation({
    mutationFn: (callId: string) => videoCallingService.endCall(callId),
    onSuccess: (_data, callId) => {
      queryClient.invalidateQueries({
        queryKey: videoCallingKeys.call(callId),
      });
      queryClient.invalidateQueries({ queryKey: videoCallingKeys.calls() });
      toast.success("Call ended");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to end call";
      toast.error(message);
    },
  });

// WebRTC Token
export const useGenerateToken = (callId: string, enabled = false) =>
  useQuery({
    queryKey: videoCallingKeys.token(callId),
    queryFn: () => videoCallingService.generateToken(callId),
    enabled: enabled && !!callId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

// Media Controls
export const useToggleAudio = () =>
  useMutation({
    mutationFn: ({
      callId,
      participantId,
      muted,
    }: {
      callId: string;
      participantId: string;
      muted: boolean;
    }) => videoCallingService.toggleAudio(callId, participantId, muted),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: videoCallingKeys.call(variables.callId),
      });
    },
  });

export const useToggleVideo = () =>
  useMutation({
    mutationFn: ({
      callId,
      participantId,
      enabled,
    }: {
      callId: string;
      participantId: string;
      enabled: boolean;
    }) => videoCallingService.toggleVideo(callId, participantId, enabled),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: videoCallingKeys.call(variables.callId),
      });
    },
  });

export const useToggleScreenShare = () =>
  useMutation({
    mutationFn: ({
      callId,
      participantId,
      enabled,
    }: {
      callId: string;
      participantId: string;
      enabled: boolean;
    }) => videoCallingService.toggleScreenShare(callId, participantId, enabled),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: videoCallingKeys.call(variables.callId),
      });
      toast.success(
        variables.enabled ? "Screen sharing started" : "Screen sharing stopped"
      );
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to toggle screen share";
      toast.error(message);
    },
  });

// Recording Management
export const useStartRecording = () =>
  useMutation({
    mutationFn: (callId: string) => videoCallingService.startRecording(callId),
    onSuccess: (recording) => {
      queryClient.invalidateQueries({
        queryKey: videoCallingKeys.call(recording.callId),
      });
      queryClient.invalidateQueries({
        queryKey: videoCallingKeys.callRecordings(recording.callId),
      });
      toast.success("Recording started");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to start recording";
      toast.error(message);
    },
  });

export const useStopRecording = () =>
  useMutation({
    mutationFn: (callId: string) => videoCallingService.stopRecording(callId),
    onSuccess: (_data, callId) => {
      queryClient.invalidateQueries({
        queryKey: videoCallingKeys.call(callId),
      });
      queryClient.invalidateQueries({
        queryKey: videoCallingKeys.callRecordings(callId),
      });
      toast.success("Recording stopped");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to stop recording";
      toast.error(message);
    },
  });

export const useRecording = (recordingId: string, enabled = true) =>
  useQuery({
    queryKey: videoCallingKeys.recording(recordingId),
    queryFn: () => videoCallingService.getRecording(recordingId),
    enabled: enabled && !!recordingId,
  });

export const useCallRecordings = (callId: string, enabled = true) =>
  useQuery({
    queryKey: videoCallingKeys.callRecordings(callId),
    queryFn: () => videoCallingService.getCallRecordings(callId),
    enabled: enabled && !!callId,
  });

export const useUserRecordings = (enabled = true) =>
  useQuery({
    queryKey: videoCallingKeys.recordings(),
    queryFn: () => videoCallingService.getUserRecordings(),
    enabled,
  });

export const useDeleteRecording = () =>
  useMutation({
    mutationFn: (recordingId: string) =>
      videoCallingService.deleteRecording(recordingId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: videoCallingKeys.recordings(),
      });
      toast.success("Recording deleted");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to delete recording";
      toast.error(message);
    },
  });

// Property Tour Management
export const useCreatePropertyTour = () =>
  useMutation({
    mutationFn: (data: PropertyTourRequest) =>
      videoCallingService.createPropertyTour(data),
    onSuccess: (tour) => {
      queryClient.invalidateQueries({
        queryKey: videoCallingKeys.tour(tour.callId),
      });
      toast.success("Property tour created");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Failed to create property tour";
      toast.error(message);
    },
  });

export const usePropertyTour = (callId: string, enabled = true) =>
  useQuery({
    queryKey: videoCallingKeys.tour(callId),
    queryFn: () => videoCallingService.getPropertyTour(callId),
    enabled: enabled && !!callId,
    refetchInterval: 5000, // Refetch every 5 seconds for live updates
  });

export const useNavigateToStop = () =>
  useMutation({
    mutationFn: ({
      callId,
      stopIndex,
    }: {
      callId: string;
      stopIndex: number;
    }) => videoCallingService.navigateToStop(callId, stopIndex),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: videoCallingKeys.tour(variables.callId),
      });
    },
  });

export const useAddTourQuestion = () =>
  useMutation({
    mutationFn: (data: TourQuestionRequest) =>
      videoCallingService.addTourQuestion(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: videoCallingKeys.tour(variables.callId),
      });
      toast.success("Question added");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Failed to add question";
      toast.error(message);
    },
  });

// Analytics
export const useCallAnalytics = (callId: string, enabled = true) =>
  useQuery({
    queryKey: videoCallingKeys.analytics(callId),
    queryFn: () => videoCallingService.getCallAnalytics(callId),
    enabled: enabled && !!callId,
  });
