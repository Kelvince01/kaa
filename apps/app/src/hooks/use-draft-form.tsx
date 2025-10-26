"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type FieldPath,
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormProps,
  type UseFormReturn,
  useForm,
} from "react-hook-form";
import { useDraftStore } from "@/shared/stores/draft.store";

// Helper function to deep clone objects to avoid immutability issues
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as T;
  }
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

// Helper function to set nested form values safely
function setNestedFormValue<T extends FieldValues>(
  form: UseFormReturn<T>,
  obj: unknown,
  prefix = ""
): void {
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const fieldPath = prefix ? `${prefix}.${key}` : key;

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      // Recursively handle nested objects
      setNestedFormValue(form, value, fieldPath);
    } else {
      // Set the value for this field
      form.setValue(fieldPath as FieldPath<T>, value as PathValue<T, Path<T>>);
    }
  }
}

/**
 * useFormWithDraft
 *
 * This hook manages form state with draft-saving support. It automatically
 * restores saved drafts on mount and tracks unsaved changes.
 *
 * @param formId - A unique identifier for the form draft storage.
 * @param opt - Optional configuration:
 *   - `formOptions`: Props passed to `useForm()` from react-hook-form.
 *   - `onUnsavedChanges`: Callback triggered when unsaved changes are detected.
 *
 * @returns - Returns form methods along with:
 *  - `unsavedChanges`: `true` if the form has unsaved changes.
 *  - `loading`: `true` while restoring draft data.
 *
 * @example
 * const form = useFormWithDraft<MyFormType>('my-form', {
 *   onUnsavedChanges: () => console.info('Unsaved changes detected!')
 * });
 *
 * return (
 *   <form onSubmit={form.handleSubmit(onSubmit)}>
 *     <input {...form.register('name')} />
 *     {form.unsavedChanges && <span>You have unsaved changes</span>}
 *     <button type="submit">Submit</button>
 *   </form>
 * );
 */
export function useFormWithDraft<
  TFieldValues extends FieldValues = FieldValues,
  TContext = unknown,
  TTransformedValues extends TFieldValues = TFieldValues,
>(
  formId: string,
  opt?: {
    formOptions?: UseFormProps<TFieldValues, TContext>;
    onUnsavedChanges?: () => void;
  }
): UseFormReturn<TFieldValues, TContext, TTransformedValues> & {
  unsavedChanges: boolean;
  loading: boolean;
} {
  const { formOptions, onUnsavedChanges } = opt ?? {};
  const form = useForm<TFieldValues, TContext, TTransformedValues>(
    formOptions as unknown as UseFormProps<
      TFieldValues,
      TContext,
      TTransformedValues
    >
  );
  const getForm = useDraftStore((state) => state.getForm);
  const setForm = useDraftStore((state) => state.setForm);
  const resetForm = useDraftStore((state) => state.resetForm);

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [loading, setLoading] = useState(true); // loading state

  // Use a ref to track the last saved values to avoid infinite loops
  const lastSavedValuesRef = useRef<string>("");
  const isDraftSaving = useRef(false);

  useEffect(() => {
    const values = getForm<TFieldValues>(formId);

    if (values) {
      isDraftSaving.current = true; // Prevent auto-saving during restoration
      onUnsavedChanges?.();
      setUnsavedChanges(true);

      // Deep clone the values to avoid immutability issues
      const clonedValues = deepClone(values);

      // Use helper function to set nested values properly
      setNestedFormValue(form, clonedValues);

      // Update the last saved values ref to prevent immediate re-save
      lastSavedValuesRef.current = JSON.stringify(clonedValues);

      // Re-enable auto-saving after a short delay
      const DRAFT_SAVE_DELAY = 100;
      setTimeout(() => {
        isDraftSaving.current = false;
      }, DRAFT_SAVE_DELAY);
    }
    setLoading(false); // Set loading to false once draft values have been applied
  }, [formId, form, getForm, onUnsavedChanges]);

  // Memoized function to clean form values
  const cleanValues = useCallback((obj: unknown): unknown => {
    if (obj === null || obj === undefined) {
      return obj;
    }
    if (typeof obj !== "object" || obj instanceof Date) {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(cleanValues);
    }

    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanValues(value);
      }
    }
    return cleaned;
  }, []);

  // Create a subscription to form changes using watch with callback
  // biome-ignore lint/correctness/useExhaustiveDependencies: form object is stable and should not trigger re-subscription
  useEffect(() => {
    if (loading) {
      return;
    }

    const subscription = form.watch((values) => {
      if (isDraftSaving.current) {
        return;
      } // Prevent saving during draft restoration

      const currentValuesString = JSON.stringify(cleanValues(values));

      // Only proceed if values actually changed
      if (currentValuesString === lastSavedValuesRef.current) {
        return;
      }

      lastSavedValuesRef.current = currentValuesString;

      if (form.formState.isDirty) {
        const cleanedValues = cleanValues(values);
        if (Object.keys(cleanedValues as Record<string, unknown>).length > 0) {
          setUnsavedChanges(true);
          setForm(formId, cleanedValues);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [loading, formId]);

  // Separate effect for handling unsaved changes cleanup
  // This runs when unsavedChanges is set and checks current isDirty state
  // biome-ignore lint/correctness/useExhaustiveDependencies: accessing form.formState.isDirty, resetForm from Zustand is stable
  useEffect(() => {
    if (!loading && unsavedChanges && !form.formState.isDirty) {
      setUnsavedChanges(false);
      resetForm(formId);
    }
  }, [loading, unsavedChanges, formId]);

  return {
    ...form,
    unsavedChanges,
    loading,
    reset: (values, keepStateOptions) => {
      resetForm(formId);
      form.reset(values, keepStateOptions);
    },
  };
}
