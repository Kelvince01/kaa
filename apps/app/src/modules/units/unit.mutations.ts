import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import * as unitService from "@/modules/units/unit.service";
import type { UnitUpdateInput } from "@/modules/units/unit.type";
import { queryClient } from "@/query/query-client";

// Create unit
export const useCreateUnit = () =>
  useMutation({
    mutationFn: unitService.createUnit,
    onSuccess: async ({ data }) => {
      toast.success("Unit created successfully!");
      await queryClient.invalidateQueries({ queryKey: ["units"] });
      await queryClient.invalidateQueries({
        queryKey: ["propertyUnits", data.property],
      });
      await queryClient.invalidateQueries({ queryKey: ["userProperties"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create unit");
    },
  });

// Update unit
export const useUpdateUnit = () =>
  useMutation({
    mutationFn: ({ id, data }: { id: string; data: UnitUpdateInput }) =>
      unitService.updateUnit(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["units", variables.id] });
    },
  });

// Delete unit
export const useDeleteUnit = () =>
  useMutation({
    mutationFn: unitService.deleteUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });

// Assign tenant to unit
export const useAssignTenantToUnit = () =>
  useMutation({
    mutationFn: ({
      unitId,
      data,
    }: {
      unitId: string;
      data: {
        tenantId: string;
        leaseStartDate: string;
        leaseEndDate?: string;
        depositPaid?: boolean;
        notes?: string;
      };
    }) => unitService.assignTenantToUnit(unitId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["units", variables.unitId] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });

// Update unit status
export const useUpdateUnitStatus = () =>
  useMutation({
    mutationFn: ({
      unitId,
      data,
    }: {
      unitId: string;
      data: {
        status: string;
        reason?: string;
      };
    }) => unitService.updateUnitStatus(unitId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["units", variables.unitId] });
    },
  });

// Update meter readings
export const useUpdateMeterReadings = () =>
  useMutation({
    mutationFn: ({
      unitId,
      data,
    }: {
      unitId: string;
      data: {
        meterReadings: {
          electricity?: number;
          water?: number;
          gas?: number;
        };
        readingDate: string;
      };
    }) => unitService.updateMeterReadings(unitId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["units", variables.unitId] });
    },
  });

// Vacate unit
export const useVacateUnit = () =>
  useMutation({
    mutationFn: ({
      unitId,
      data,
    }: {
      unitId: string;
      data: {
        vacateDate: string;
        reason?: string;
        notes?: string;
      };
    }) => unitService.vacateUnit(unitId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["units", variables.unitId] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });

// Bulk update units
export const useBulkUpdateUnits = () =>
  useMutation({
    mutationFn: ({
      unitIds,
      data,
    }: {
      unitIds: string[];
      data: Partial<UnitUpdateInput>;
    }) => unitService.bulkUpdateUnits(unitIds, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
