import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as maintenanceService from "./maintenance.service";
import type {
  MaintenanceStatus,
  MaintenanceUpdateInput,
} from "./maintenance.type";

// Get all maintenance requests
export const useMaintenancesByUser = (params: any = {}) =>
  useQuery({
    queryKey: ["maintenance", "user", params],
    queryFn: () => maintenanceService.getMaintenancesByUser(params),
  });

// Get maintenance by ID
export const useMaintenance = (id: string) =>
  useQuery({
    queryKey: ["maintenance", id],
    queryFn: () => maintenanceService.getMaintenance(id),
    enabled: !!id,
  });

// Create maintenance
export const useCreateMaintenance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: maintenanceService.createMaintenance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance", "user"] });
    },
  });
};

// Update maintenance
export const useUpdateMaintenance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MaintenanceUpdateInput }) =>
      maintenanceService.updateMaintenance(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance", "user"] });
      queryClient.invalidateQueries({
        queryKey: ["maintenance", variables.id],
      });
    },
  });
};

// Add update/comment to maintenance
export const useAddMaintenanceUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      update,
    }: {
      id: string;
      update: {
        message: string;
        status?: MaintenanceStatus;
        attachments?: {
          url: string;
          fileName: string;
          fileType: string;
          size: number;
        }[];
      };
    }) => maintenanceService.addMaintenanceUpdate(id, update),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance", "user"] });
      queryClient.invalidateQueries({
        queryKey: ["maintenance", variables.id],
      });
    },
  });
};
