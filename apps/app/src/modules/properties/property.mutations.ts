"use client";

import type { UpdatePropertyData } from "@kaa/models/types";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/query/query-client";
import * as propertyService from "./property.service";
import type { PropertySearchParams } from "./property.type";

// Create property mutation
export const useCreateProperty = () => {
  return useMutation({
    mutationFn: propertyService.createProperty,
    onSuccess: () => {
      // Invalidate and refetch properties
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "user"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "featured"] });
    },
  });
};

// Update property mutation
export const useUpdateProperty = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePropertyData }) =>
      propertyService.updateProperty(id, data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch properties
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["properties", "user"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "featured"] });
    },
  });
};

// Delete property mutation
export const useDeleteProperty = () => {
  return useMutation({
    mutationFn: propertyService.deleteProperty,
    onSuccess: () => {
      // Invalidate and refetch properties
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "user"] });
      queryClient.invalidateQueries({ queryKey: ["properties", "featured"] });
    },
  });
};

// Upload property images mutation
export const useUploadPropertyImages = () => {
  return useMutation({
    mutationFn: ({
      id,
      imageUrls,
      mainImageIndex,
    }: {
      id: string;
      imageUrls: string[];
      mainImageIndex?: number;
    }) =>
      propertyService.uploadPropertyImages(id, imageUrls, mainImageIndex || 0),
    onSuccess: (_, variables) => {
      // Invalidate and refetch property
      queryClient.invalidateQueries({ queryKey: ["properties", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
};

// Update property status mutation
export const useUpdatePropertyStatus = () => {
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      propertyService.updatePropertyStatus(id, status),
    onSuccess: (_, variables) => {
      // Invalidate and refetch properties
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["properties", "user"] });
    },
  });
};

// Toggle property featured mutation
export const useTogglePropertyFeatured = () => {
  return useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) =>
      propertyService.togglePropertyFeatured(id, featured),
    onSuccess: (_, variables) => {
      // Invalidate and refetch properties
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["properties", "featured"] });
    },
  });
};

// Toggle property verification mutation
export const useTogglePropertyVerification = () => {
  return useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      propertyService.togglePropertyVerification(id, verified),
    onSuccess: (_, variables) => {
      // Invalidate and refetch properties
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["properties", "user"] });
    },
  });
};

// Toggle property favorite mutation
export const useTogglePropertyFavorite = () => {
  return useMutation({
    mutationFn: propertyService.togglePropertyFavorite,
    onSuccess: () => {
      // Invalidate and refetch favorites and properties
      queryClient.invalidateQueries({ queryKey: ["properties", "favorites"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
};

// Submit property inquiry mutation
export const useSubmitPropertyInquiry = () =>
  useMutation({
    mutationFn: propertyService.submitPropertyInquiry,
  });

// Validate address
export const useValidateAddress = () =>
  useMutation({
    mutationFn: propertyService.validateAddress,
  });

// Save search
export const useSaveSearch = () =>
  useMutation({
    mutationFn: ({
      name,
      filters,
      notifications,
    }: {
      name: string;
      filters: PropertySearchParams;
      notifications: boolean;
    }) => propertyService.saveSearch(name, filters, notifications),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
  });

// Delete saved search
export const useDeleteSavedSearch = () =>
  useMutation({
    mutationFn: propertyService.deleteSavedSearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
    },
  });

// Upload virtual tour
export const useUploadVirtualTour = () =>
  useMutation({
    mutationFn: ({
      propertyId,
      tourData,
    }: {
      propertyId: string;
      tourData: any;
    }) => propertyService.uploadVirtualTour(propertyId, tourData),
    onSuccess: (_, { propertyId }) => {
      queryClient.invalidateQueries({ queryKey: ["virtual-tour", propertyId] });
    },
  });

// Subscribe to property alerts
export const useSubscribeToPropertyAlerts = () =>
  useMutation({
    mutationFn: ({
      propertyId,
      alertTypes,
    }: {
      propertyId: string;
      alertTypes: string[];
    }) => propertyService.subscribeToPropertyAlerts(propertyId, alertTypes),
    onSuccess: (_, { propertyId }) => {
      queryClient.invalidateQueries({
        queryKey: ["property-alerts", propertyId],
      });
    },
  });
