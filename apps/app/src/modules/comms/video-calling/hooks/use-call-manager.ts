"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import {
  // useCall,
  useCreateCall,
  useEndCall,
  useJoinCall,
  useLeaveCall,
} from "../video-calling.queries";
import { videoCallingService } from "../video-calling.service";
import { useVideoCallingStore } from "../video-calling.store";
import type {
  CreateCallRequest,
  IVideoCall,
  JoinCallRequest,
} from "../video-calling.type";

export const useCallManager = () => {
  const {
    currentCall,
    localParticipant,
    setCurrentCall,
    setLocalParticipant,
    setIsConnecting,
    reset,
  } = useVideoCallingStore();

  const createCallMutation = useCreateCall();
  const joinCallMutation = useJoinCall();
  const leaveCallMutation = useLeaveCall();
  const endCallMutation = useEndCall();

  const createCall = useCallback(
    async (data: CreateCallRequest) => {
      try {
        setIsConnecting(true);
        const call = await createCallMutation.mutateAsync(data);
        setCurrentCall(call.data);
        return call;
      } catch (error) {
        console.error("Error creating call:", error);
        throw error;
      } finally {
        setIsConnecting(false);
      }
    },
    [createCallMutation, setCurrentCall, setIsConnecting]
  );

  const joinCall = useCallback(
    async (data: JoinCallRequest) => {
      try {
        setIsConnecting(true);
        const call = await joinCallMutation.mutateAsync(data);
        //// biome-ignore lint/correctness/useHookAtTopLevel: ignore
        // const currentCall = useCall(call.data.callId);
        const currentCall = await videoCallingService.getCall(call.data.callId);
        setCurrentCall(currentCall.data as IVideoCall);

        // Find local participant
        const participant = currentCall.data?.participants.find(
          (p) => p.userId === data.callId
        );
        if (participant) {
          setLocalParticipant(participant);
        }

        return currentCall;
      } catch (error) {
        console.error("Error joining call:", error);
        throw error;
      } finally {
        setIsConnecting(false);
      }
    },
    [joinCallMutation, setCurrentCall, setLocalParticipant, setIsConnecting]
  );

  const leaveCall = useCallback(async () => {
    if (!(currentCall && localParticipant)) {
      toast.error("No active call");
      return;
    }

    try {
      await leaveCallMutation.mutateAsync({
        callId: currentCall.id,
        participantId: localParticipant.id,
      });
      reset();
    } catch (error) {
      console.error("Error leaving call:", error);
      throw error;
    }
  }, [currentCall, localParticipant, leaveCallMutation, reset]);

  const endCall = useCallback(async () => {
    if (!currentCall) {
      toast.error("No active call");
      return;
    }

    try {
      await endCallMutation.mutateAsync(currentCall.id);
      reset();
    } catch (error) {
      console.error("Error ending call:", error);
      throw error;
    }
  }, [currentCall, endCallMutation, reset]);

  return {
    currentCall,
    localParticipant,
    createCall,
    joinCall,
    leaveCall,
    endCall,
    isCreating: createCallMutation.isPending,
    isJoining: joinCallMutation.isPending,
    isLeaving: leaveCallMutation.isPending,
    isEnding: endCallMutation.isPending,
  };
};
