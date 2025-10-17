import { useQuery } from "@tanstack/react-query";
import * as unitService from "./unit.service";

// Get all units
export const useUnits = (params: any = {}) =>
  useQuery({
    queryKey: ["units", params],
    queryFn: () => unitService.getUnits(params),
  });

// Get unit by ID
export const useUnit = (id: string) =>
  useQuery({
    queryKey: ["units", id],
    queryFn: () => unitService.getUnit(id),
    enabled: !!id,
  });

// Get units by property ID
export const useUnitsByProperty = (propertyId: string, params: any = {}) =>
  useQuery({
    queryKey: ["units", "property", propertyId, params],
    queryFn: () => unitService.getUnitsByProperty(propertyId, params),
    enabled: !!propertyId,
  });

// Get unit analytics
export const useUnitAnalytics = (unitId: string) =>
  useQuery({
    queryKey: ["units", unitId, "analytics"],
    queryFn: () => unitService.getUnitAnalytics(unitId),
    enabled: !!unitId,
  });

// Get available units
export const useAvailableUnits = (params: any = {}) =>
  useQuery({
    queryKey: ["units", "available", params],
    queryFn: () => unitService.getAvailableUnits(params),
  });
