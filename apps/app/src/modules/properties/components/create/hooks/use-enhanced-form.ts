import { zodResolver } from "@hookform/resolvers/zod";
import type { CreatePropertyData, PropertyType } from "@kaa/models/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { useDraftStore } from "@/shared/stores/draft.store";
import { useCreateProperty } from "../../../property.mutations";
import type { Property } from "../../../property.type";
import {
  defaultPropertyFormValues,
  type PropertyFormData,
  propertyFormSchema,
} from "../schema";

type UseEnhancedFormOptions = {
  propertyId?: string;
  autoSaveInterval?: number;
  enableOptimisticUpdates?: boolean;
  onSuccess?: (property: Property) => void;
  onError?: (error: Error) => void;
};

type FormState = {
  isDirty: boolean;
  isSaving: boolean;
  lastSaved?: Date;
  hasUnsavedChanges: boolean;
  saveError?: string;
  connectionStatus: "online" | "offline" | "unstable";
};

// Transform PropertyFormData to CreatePropertyData format
function transformPropertyFormData(
  formData: PropertyFormData
): CreatePropertyData {
  // Create a basic structure that matches the expected API format
  // This will need to be refined based on the actual CreatePropertyData interface
  const transformedData: any = {
    // Basic property info
    title: formData.basic.title,
    description: formData.basic.description,
    type: formData.basic.type,
    listingType: formData.basic.listingType,

    // Location - flatten the nested structure
    county: formData.location.county,
    constituency: formData.location.constituency,
    country: formData.location.country || "Kenya",
    address: formData.location.address.line1,
    town: formData.location.address.town,
    postalCode: formData.location.address.postalCode,
    neighborhood: formData.location.neighborhood,
    landmark: formData.location.landmark,

    // Coordinates
    coordinates: formData.location.coordinates
      ? [formData.location.coordinates.lng, formData.location.coordinates.lat]
      : undefined,

    // Property details
    bedrooms: formData.details.bedrooms,
    bathrooms: formData.details.bathrooms,
    size: formData.details.size,
    floor: formData.details.floor,
    totalFloors: formData.details.totalFloors,
    yearBuilt: formData.details.yearBuilt,
    condition: formData.details.condition,
    orientation: formData.details.orientation,
    view: formData.details.view,

    // Pricing
    rentAmount: formData.pricing.rentAmount,
    currency: formData.pricing.currency,
    paymentFrequency: formData.pricing.paymentFrequency,
    securityDeposit: formData.pricing.securityDeposit,
    serviceCharge: formData.pricing.serviceCharge,
    utilitiesIncluded: formData.pricing.utilitiesIncluded,
    negotiable: formData.pricing.negotiable,
    minimumStay: formData.pricing.minimumStay,
    maximumStay: formData.pricing.maximumStay,
    advancePayment: formData.pricing.advancePayment,

    // Features and amenities
    amenities: formData.features.amenities,
    accessibility: formData.features.accessibility,
    safety: formData.features.safety,
    appliances: formData.features.appliances,
    utilities: formData.features.utilities,
    features: formData.features.features,
    furnished: formData.basic.furnished,
    petPolicy: formData.basic.petPolicy,
    smokingPolicy: formData.basic.smokingPolicy,

    // Availability
    status: formData.availability.status,
    availableFrom: formData.availability.availableFrom?.toISOString(),
    availableTo: formData.availability.availableTo?.toISOString(),
    noticePeriod: formData.availability.noticePeriod,
    instantBooking: formData.availability.instantBooking,
    minimumNotice: formData.availability.minimumNotice,
    maximumBookingsPerDay: formData.availability.maximumBookingsPerDay,

    // Media
    images: formData.media.photos.map((photo, index) => ({
      url: photo.url,
      caption: photo.caption,
      isPrimary: photo.isPrimary || index === 0,
    })),
    videos: formData.media.videos?.map((video) => ({
      url: video.url,
      thumbnail: video.thumbnail,
      duration: video.duration,
      caption: video.caption,
    })),
    virtualTour: formData.media.virtualTour,

    // Contact
    ...(formData.contact && {
      preferredContact: formData.contact.preferredContact,
      phoneNumber: formData.contact.phoneNumber,
      whatsappNumber: formData.contact.whatsappNumber,
      showingInstructions: formData.contact.showingInstructions,
      responseTime: formData.contact.responseTime,
      languages: formData.contact.languages,
    }),

    // Tags
    tags: formData.basic.tags,

    // Metadata
    source: formData.metadata?.source || "manual",
    version: formData.metadata?.version || 1,
    draft: formData.metadata?.draft ?? true,
  };

  const transformedCreateData: CreatePropertyData = {
    title: formData.basic.title,
    description: formData.basic.description,
    type: formData.basic.type as PropertyType,
    county: formData.location.county,
    estate: formData.location.neighborhood || "",
    address: formData.location.address.line1,
    coordinates: formData.location.coordinates
      ? {
          latitude: formData.location.coordinates.lat,
          longitude: formData.location.coordinates.lng,
        }
      : { latitude: 0, longitude: 0 },
    bedrooms: formData.details.bedrooms,
    bathrooms: formData.details.bathrooms,
    furnished: formData.basic.furnished,
    totalArea: formData.details.size,
    condition: formData.details.condition,
    rent: formData.pricing.rentAmount,
    deposit: formData.pricing.securityDeposit || 0,
    paymentFrequency: formData.pricing.paymentFrequency as any,
    advanceMonths: formData.pricing.advancePayment,
    depositMonths: formData.pricing.securityDeposit || 0,
    amenities: formData.features.amenities ?? [
      "wifi",
      "water",
      "electricity",
      "internet",
    ],
    images: formData.media.photos.map((photo) => photo.url),
    availableFrom: formData.availability.availableFrom
      ? new Date(formData.availability.availableFrom).toISOString()
      : new Date().toISOString(),
    viewingContact: formData.contact?.preferredContact
      ? {
          name: formData.contact.preferredContact,
          phone: formData.contact.phoneNumber,
        }
      : { name: "John Doe", phone: "+254712345678" },
    petsAllowed: formData.basic.petPolicy === "allowed",
    minimumLease: formData.pricing.minimumStay || 0,
    tags: formData.basic.tags,
  };

  return transformedCreateData;
}

export function useEnhancedForm({
  propertyId,
  autoSaveInterval = 30_000, // 30 seconds
  enableOptimisticUpdates = true,
  onSuccess,
  onError,
}: UseEnhancedFormOptions = {}) {
  const queryClient = useQueryClient();
  const { forms, setForm, resetForm } = useDraftStore();
  const createPropertyMutation = useCreateProperty();
  const [formState, setFormState] = useState<FormState>({
    isDirty: false,
    isSaving: false,
    hasUnsavedChanges: false,
    connectionStatus: "online",
  });

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveDataRef = useRef<string>("");

  // Initialize form with draft data
  const form: UseFormReturn<PropertyFormData> = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues:
      forms[`property-${propertyId || "new"}`] || defaultPropertyFormValues,
    mode: "onChange",
  });

  // Watch form data for changes
  const formData = form.watch();
  const formDataString = JSON.stringify(formData);

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      // Simulate API call - replace with actual property service
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Save to draft store as backup
      setForm(`property-${propertyId || "new"}`, data);

      return data;
    },
    onMutate: async (newData) => {
      if (enableOptimisticUpdates) {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: ["property", propertyId] });

        // Snapshot previous value
        const previousProperty = queryClient.getQueryData([
          "property",
          propertyId,
        ]);

        // Optimistically update
        if (propertyId) {
          queryClient.setQueryData(["property", propertyId], (old: any) => ({
            ...old,
            ...newData,
          }));
        }

        return { previousProperty };
      }
    },
    onSuccess: (data) => {
      setFormState((prev) => ({
        ...prev,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        saveError: undefined,
      }));

      lastSaveDataRef.current = JSON.stringify(data);
      toast.success("Changes saved automatically", {
        duration: 2000,
        id: "auto-save",
      });
    },
    onError: (error, _variables, context) => {
      // Revert optimistic update on error
      if (context?.previousProperty && propertyId) {
        queryClient.setQueryData(
          ["property", propertyId],
          context.previousProperty
        );
      }

      setFormState((prev) => ({
        ...prev,
        saveError: error.message,
      }));

      toast.error("Failed to save changes", {
        description: "Don't worry, your data is saved locally",
        duration: 5000,
      });

      onError?.(error as Error);
    },
    onSettled: () => {
      setFormState((prev) => ({ ...prev, isSaving: false }));
    },
  });

  // Manual save mutation for explicit saves
  const saveMutation = useMutation({
    mutationFn: (data: PropertyFormData) => {
      const transformedData = transformPropertyFormData(data);
      return createPropertyMutation.mutateAsync(transformedData);
    },
    onSuccess: (property: Property) => {
      setFormState((prev) => ({
        ...prev,
        hasUnsavedChanges: false,
        lastSaved: new Date(),
      }));

      // Clear draft after successful save
      resetForm(`property-${propertyId || "new"}`);

      toast.success(
        propertyId
          ? "Property updated successfully"
          : "Property created successfully"
      );
      onSuccess?.(property);
    },
    onError: (error) => {
      toast.error("Failed to save property");
      onError?.(error as Error);
    },
  });

  // Auto-save logic
  const triggerAutoSave = useCallback(() => {
    if (formDataString === lastSaveDataRef.current) return;

    const parsedData = JSON.parse(formDataString) as PropertyFormData;

    // Only auto-save if form has meaningful data
    const hasContent =
      parsedData.basic?.title ||
      parsedData.basic?.description ||
      parsedData.media?.photos?.length > 0;

    if (hasContent && !autoSaveMutation.isPending) {
      setFormState((prev) => ({ ...prev, isSaving: true }));
      autoSaveMutation.mutate(parsedData);
    }
  }, [formDataString, autoSaveMutation]);

  // Set up auto-save timer
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (
      formState.hasUnsavedChanges &&
      formState.connectionStatus === "online"
    ) {
      autoSaveTimerRef.current = setTimeout(triggerAutoSave, autoSaveInterval);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    formState.hasUnsavedChanges,
    formState.connectionStatus,
    triggerAutoSave,
    autoSaveInterval,
  ]);

  // Track form changes
  useEffect(() => {
    const hasChanges = formDataString !== lastSaveDataRef.current;
    setFormState((prev) => ({
      ...prev,
      isDirty: form.formState.isDirty,
      hasUnsavedChanges: hasChanges,
    }));
  }, [formDataString, form.formState.isDirty]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () =>
      setFormState((prev) => ({ ...prev, connectionStatus: "online" }));
    const handleOffline = () =>
      setFormState((prev) => ({ ...prev, connectionStatus: "offline" }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Prevent navigation if unsaved changes
  useBeforeUnload({
    when: formState.hasUnsavedChanges,
    message: "You have unsaved changes. Are you sure you want to leave?",
  });

  // Manual save function
  const save = useCallback(async () => {
    const isValid = await form.trigger();

    console.log("isValid", isValid);
    console.log("form.formState.errors", form.formState.errors);
    console.log("form.formState.isDirty", form.formState.isDirty);
    console.log("form.formState.isValid", form.formState.isValid);

    // if (!isValid) {
    //   toast.error("Please fix validation errors before saving");
    //   return;
    // }

    const data = form.getValues();

    console.log("data", data);

    return saveMutation.mutateAsync(data);
  }, [form, saveMutation]);

  // Force auto-save now
  const saveNow = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    triggerAutoSave();
  }, [triggerAutoSave]);

  // Recovery functions
  const recoverFromDraft = useCallback(() => {
    const draftData = forms[`property-${propertyId || "new"}`];
    if (draftData) {
      form.reset(draftData);
      toast.success("Recovered unsaved changes from draft");
    }
  }, [form, forms, propertyId]);

  const discardChanges = useCallback(() => {
    resetForm(`property-${propertyId || "new"}`);
    form.reset();
    setFormState((prev) => ({ ...prev, hasUnsavedChanges: false }));
    toast.success("Changes discarded");
  }, [form, resetForm, propertyId]);

  return {
    form,
    formState,
    save,
    saveNow,
    recoverFromDraft,
    discardChanges,
    isLoading: saveMutation.isPending || autoSaveMutation.isPending,
  };
}
