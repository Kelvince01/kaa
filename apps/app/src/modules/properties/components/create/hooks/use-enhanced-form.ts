import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { useDraftStore } from "@/shared/stores/draft.store";
import {
  defaultPropertyFormValues,
  type PropertyFormData,
  propertyFormSchema,
} from "../schema";
import type { Property } from "../types/property.type";

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

export function useEnhancedForm({
  propertyId,
  autoSaveInterval = 30_000, // 30 seconds
  enableOptimisticUpdates = true,
  onSuccess,
  onError,
}: UseEnhancedFormOptions = {}) {
  const queryClient = useQueryClient();
  const { forms, setForm, resetForm } = useDraftStore();
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
    mutationFn: async (data: PropertyFormData) => {
      // Replace with actual API call
      const response = await fetch(
        `/api/properties${propertyId ? `/${propertyId}` : ""}`,
        {
          method: propertyId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) throw new Error("Failed to save property");
      return response.json();
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
    if (!isValid) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    const data = form.getValues();
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
