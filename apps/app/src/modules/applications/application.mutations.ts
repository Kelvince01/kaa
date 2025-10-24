import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryClient } from "@/query/query-client";
import * as applicationService from "./application.service";
import { useApplicationStore } from "./application.store";
import type { ApplicationUpdateInput } from "./application.type";

// Create application
export const useCreateApplication = () =>
  useMutation({
    mutationFn: applicationService.createApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

// Update application
export const useUpdateApplication = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApplicationUpdateInput }) =>
      applicationService.updateApplication(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({
        queryKey: ["applications", variables.id],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

// Update applications
export const useUpdateApplications = () =>
  useMutation({
    mutationFn: ({
      ids,
      data,
    }: {
      ids: string[];
      data: ApplicationUpdateInput;
    }) => applicationService.updateApplications(ids, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

// Submit application
export const useSubmitApplication = () => {
  const { selectedApplicationId } = useApplicationStore();

  return useMutation({
    mutationFn: applicationService.submitApplication,
    onSuccess: (_, _id) => {
      toast.success("Application submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["applications"] });

      if (selectedApplicationId) {
        queryClient.invalidateQueries({
          queryKey: ["applications", selectedApplicationId],
        });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit application");
    },
  });
};

// Approve application
export const useApproveApplication = () =>
  useMutation({
    mutationFn: applicationService.approveApplication,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications", id] });
    },
  });

// Reject application
export const useRejectApplication = () =>
  useMutation({
    mutationFn: ({
      id,
      rejectionReason,
    }: {
      id: string;
      rejectionReason: string;
    }) => applicationService.rejectApplication(id, rejectionReason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({
        queryKey: ["applications", variables.id],
      });
    },
  });

// Withdraw application
export const useWithdrawApplication = () =>
  useMutation({
    mutationFn: applicationService.withdrawApplication,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["applications", id] });
    },
  });
