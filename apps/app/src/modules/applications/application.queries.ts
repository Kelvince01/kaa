import { useQuery } from "@tanstack/react-query";
import * as applicationService from "./application.service";
import type { ApplicationFilter } from "./application.type";

// Get all applications
export const useApplications = (params: ApplicationFilter) =>
  useQuery({
    queryKey: ["applications", params],
    queryFn: () => applicationService.getApplications(params),
  });

// Get all applications
export const useApplicationStatusCounts = (params?: ApplicationFilter) =>
  useQuery({
    queryKey: ["applications", "status-counts", params],
    queryFn: () => applicationService.getApplicationStatusCounts(params),
  });

// Get all applications
export const useApplicationEstimatedOfferAmount = (
  params?: ApplicationFilter
) =>
  useQuery({
    queryKey: ["applications", "estimated-offer-amount", params],
    queryFn: () => applicationService.getEstimatedOfferAmount(params),
  });

// Get application by ID
export const useApplication = (id: string) =>
  useQuery({
    queryKey: ["applications", "application", id],
    queryFn: () => applicationService.getApplication(id),
    enabled: !!id,
  });
