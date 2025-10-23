import { useQueryClient } from "@tanstack/react-query";
import { debounce } from "lodash-es";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { PropertyFormData } from "../schema";
import { useAIAssistant } from "./use-ai-assistant";

// Types for smart form features
type SmartSuggestion = {
  field: string;
  value: string;
  confidence: number;
  reason: string;
  type: "ai" | "historical" | "market_data";
};

type ValidationIssue = {
  field: string;
  message: string;
  severity: "error" | "warning" | "info";
  suggestion?: string;
};

type FormFieldAnalysis = {
  completeness: number;
  quality: number;
  suggestions: SmartSuggestion[];
  issues: ValidationIssue[];
};

type AutofillData = {
  [key: string]: any;
};

// Smart form assistance hook
export function useSmartForm(
  formData: Partial<PropertyFormData>,
  onUpdateField: (field: string, value: any) => void
) {
  const queryClient = useQueryClient();
  const [activeField, setActiveField] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<
    Record<string, SmartSuggestion[]>
  >({});
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>(
    []
  );
  const [isValidating, setIsValidating] = useState(false);
  const [autofillSuggestions, setAutofillSuggestions] = useState<AutofillData>(
    {}
  );

  const { getSmartSuggestions, validatePropertyData, applyOptimisticUpdate } =
    useAIAssistant(formData);

  // Debounced validation function
  const debouncedValidation = useMemo(
    () =>
      debounce(async (data: Partial<PropertyFormData>) => {
        if (!data || Object.keys(data).length === 0) return;

        setIsValidating(true);
        try {
          const validation: any = await validatePropertyData(data);
          setValidationIssues(validation?.issues ?? []);

          // Convert suggestions to autofill format
          const autofill: AutofillData = {};
          for (const suggestion of validation.suggestions) {
            autofill[suggestion.field] = suggestion.suggestion;
          }
          setAutofillSuggestions(autofill);
        } catch (error) {
          console.error("Form validation failed:", error);
        } finally {
          setIsValidating(false);
        }
      }, 1000),
    [validatePropertyData]
  );

  // Auto-validate when form data changes
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      debouncedValidation(formData);
    }
  }, [formData, debouncedValidation]);

  // Get smart suggestions for a specific field
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  const getSugggestionsForField = useCallback(
    async (fieldName: string, context?: any) => {
      try {
        const fieldSuggestions = await getSmartSuggestions(fieldName);

        // Add historical data suggestions
        const historicalSuggestions = await getHistoricalSuggestions(
          fieldName,
          context
        );

        // Combine and format suggestions
        const allSuggestions: SmartSuggestion[] = [
          ...fieldSuggestions.map((suggestion) => ({
            field: fieldName,
            value: suggestion,
            confidence: 0.8,
            reason: "AI-generated suggestion",
            type: "ai" as const,
          })),
          ...historicalSuggestions,
        ];

        setSuggestions((prev) => ({
          ...prev,
          [fieldName]: allSuggestions,
        }));

        return allSuggestions;
      } catch (error) {
        console.error(`Failed to get suggestions for ${fieldName}:`, error);
        return [];
      }
    },
    [getSmartSuggestions]
  );

  // Get historical suggestions based on similar properties
  const getHistoricalSuggestions = (
    fieldName: string,
    _context?: any
  ): SmartSuggestion[] => {
    // This would typically query a backend service for historical data
    // For now, return mock data based on field type
    const historicalData: Record<string, string[]> = {
      amenities: [
        "Swimming pool",
        "Gym",
        "Parking",
        "Security",
        "Garden",
        "Balcony",
        "Air conditioning",
        "Internet",
        "DSTV",
      ],
      title: [
        "Modern 2BR Apartment in Kilimani",
        "Spacious 3BR House with Garden",
        "Luxury Studio in Westlands",
        "Executive 4BR Villa with Pool",
      ],
      neighborhood: [
        "Kilimani",
        "Westlands",
        "Karen",
        "Kileleshwa",
        "Lavington",
        "Runda",
        "Muthaiga",
        "Spring Valley",
        "Riverside",
      ],
    };

    const values = historicalData[fieldName] || [];
    return values.slice(0, 5).map((value) => ({
      field: fieldName,
      value,
      confidence: 0.6,
      reason: "Based on similar properties",
      type: "historical" as const,
    }));
  };

  // Smart auto-complete function
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  const getAutoComplete = useCallback(
    async (fieldName: string, partialValue: string) => {
      if (partialValue.length < 2) return [];

      // Check cached suggestions first
      const cacheKey = ["autocomplete", fieldName, partialValue.toLowerCase()];
      const cached = queryClient.getQueryData(cacheKey);
      if (cached) return cached as string[];

      try {
        // This would typically call a backend autocomplete service
        // For now, simulate with local data
        const suggestions = await simulateAutoComplete(fieldName, partialValue);

        // Cache for 5 minutes
        queryClient.setQueryData(cacheKey, suggestions, {
          // staleTime: 5 * 60 * 1000,
        });

        return suggestions;
      } catch (error) {
        console.error("Autocomplete failed:", error);
        return [];
      }
    },
    [queryClient]
  );

  // Simulate autocomplete (would be replaced with actual API call)
  const simulateAutoComplete = (
    fieldName: string,
    partial: string
  ): string[] => {
    const data: Record<string, string[]> = {
      city: [
        "Nairobi",
        "Mombasa",
        "Nakuru",
        "Eldoret",
        "Kisumu",
        "Thika",
        "Nyeri",
        "Machakos",
        "Meru",
        "Kericho",
        "Garissa",
        "Kitale",
        "Malindi",
      ],
      county: [
        "Nairobi",
        "Kiambu",
        "Machakos",
        "Kajiado",
        "Muranga",
        "Nyeri",
        "Mombasa",
        "Kilifi",
        "Kwale",
        "Nakuru",
        "Uasin Gishu",
      ],
      neighborhood: [
        "Kilimani",
        "Westlands",
        "Karen",
        "Kileleshwa",
        "Lavington",
        "Runda",
        "Muthaiga",
        "Spring Valley",
        "Riverside",
        "Parklands",
        "Hurlingham",
        "Kileleshwa",
        "Loresho",
        "Gigiri",
      ],
    };

    const items = data[fieldName] || [];
    return items
      .filter((item) => item.toLowerCase().includes(partial.toLowerCase()))
      .slice(0, 8);
  };

  // Apply smart suggestion
  const applySuggestion = useCallback(
    (suggestion: SmartSuggestion) => {
      // Apply optimistic update
      applyOptimisticUpdate(suggestion.field, suggestion.value);

      // Update the form
      onUpdateField(suggestion.field, suggestion.value);

      // Remove the applied suggestion
      setSuggestions((prev) => ({
        ...prev,
        [suggestion.field]:
          prev[suggestion.field]?.filter((s) => s.value !== suggestion.value) ||
          [],
      }));
    },
    [applyOptimisticUpdate, onUpdateField]
  );

  // Auto-fill form with suggested values
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  const autoFillForm = useCallback(() => {
    const fieldsToFill: Array<{
      field: string;
      value: any;
      confidence: number;
    }> = [];

    // Get suggestions for empty or partially filled fields
    const emptyFields = Object.keys(autofillSuggestions);

    for (const field of emptyFields) {
      const currentValue = getNestedValue(formData, field);
      if (
        !currentValue ||
        (typeof currentValue === "string" && currentValue.trim() === "")
      ) {
        const suggestion = autofillSuggestions[field];
        if (suggestion) {
          fieldsToFill.push({
            field,
            value: suggestion,
            confidence: 0.7,
          });
        }
      }
    }

    // Apply auto-fill suggestions
    for (const { field, value } of fieldsToFill) {
      onUpdateField(field, value);
    }

    return fieldsToFill.length;
  }, [autofillSuggestions, formData, onUpdateField]);

  // Get form completion percentage
  // biome-ignore lint/correctness/useExhaustiveDependencies: ignore
  const getFormCompleteness = useCallback((): FormFieldAnalysis => {
    const requiredFields = [
      "basic.title",
      "basic.type",
      "location.city",
      "location.county",
      "details.bedrooms",
      "details.bathrooms",
      "pricing.rentAmount",
    ];

    const totalFields = requiredFields.length;
    let completedFields = 0;
    let qualityScore = 0;
    const issues: ValidationIssue[] = [];

    for (const field of requiredFields) {
      const value = getNestedValue(formData, field);
      if (value !== undefined && value !== null && value !== "") {
        completedFields++;

        // Calculate quality score based on value
        if (typeof value === "string" && value.length > 3) {
          qualityScore += 1;
        } else if (typeof value === "number" && value > 0) {
          qualityScore += 1;
        }
      } else {
        issues.push({
          field,
          message: `${field.split(".").pop()} is required`,
          severity: "error",
        });
      }
    }

    const completeness = (completedFields / totalFields) * 100;
    const quality = (qualityScore / totalFields) * 100;

    // Get current suggestions for incomplete fields
    const currentSuggestions: SmartSuggestion[] = [];
    for (const fieldSuggestions of Object.values(suggestions)) {
      currentSuggestions.push(...fieldSuggestions);
    }

    return {
      completeness,
      quality,
      suggestions: currentSuggestions.slice(0, 5), // Top 5 suggestions
      issues: [...issues, ...validationIssues],
    };
  }, [formData, suggestions, validationIssues]);

  // Helper to get nested object values
  const getNestedValue = (obj: any, path: string): any =>
    path.split(".").reduce((current, key) => current?.[key], obj);

  // Smart field focus handler
  const handleFieldFocus = useCallback(
    (fieldName: string) => {
      setActiveField(fieldName);

      // Preload suggestions for the focused field
      if (!suggestions[fieldName] || suggestions[fieldName].length === 0) {
        getSugggestionsForField(fieldName);
      }
    },
    [suggestions, getSugggestionsForField]
  );

  // Smart field blur handler
  const handleFieldBlur = useCallback(
    (fieldName: string, value: any) => {
      setActiveField(null);

      // Trigger validation for the field
      if (value && value !== "") {
        debouncedValidation({ ...formData, [fieldName]: value });
      }
    },
    [formData, debouncedValidation]
  );

  return {
    // State
    activeField,
    suggestions,
    validationIssues,
    isValidating,
    autofillSuggestions,

    // Functions
    getSugggestionsForField,
    getAutoComplete,
    applySuggestion,
    autoFillForm,
    getFormCompleteness,
    handleFieldFocus,
    handleFieldBlur,

    // Computed values
    formAnalysis: getFormCompleteness(),
  };
}

// Hook for smart input component with autocomplete
export function useSmartInput(
  fieldName: string,
  value: string,
  onChange: (value: string) => void,
  smartForm: ReturnType<typeof useSmartForm>
) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
    string[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Debounced autocomplete function
  const debouncedAutocomplete = useMemo(
    () =>
      debounce(async (fieldName: string, value: string) => {
        if (value.length < 2) {
          setAutocompleteSuggestions([]);
          return;
        }

        setLoading(true);
        try {
          const suggestions = await smartForm.getAutoComplete(fieldName, value);
          setAutocompleteSuggestions(suggestions);
        } catch (error) {
          console.error("Autocomplete failed:", error);
        } finally {
          setLoading(false);
        }
      }, 300),
    [smartForm]
  );

  // Handle input change with autocomplete
  const handleChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
      debouncedAutocomplete(fieldName, newValue);
    },
    [onChange, fieldName, debouncedAutocomplete]
  );

  // Handle focus
  const handleFocus = useCallback(() => {
    smartForm.handleFieldFocus(fieldName);
    setShowSuggestions(true);

    if (value.length >= 2) {
      debouncedAutocomplete(fieldName, value);
    }
  }, [smartForm, fieldName, value, debouncedAutocomplete]);

  // Handle blur
  const handleBlur = useCallback(() => {
    smartForm.handleFieldBlur(fieldName, value);
    // Delay hiding suggestions to allow clicking
    setTimeout(() => setShowSuggestions(false), 200);
  }, [smartForm, fieldName, value]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      onChange(suggestion);
      setShowSuggestions(false);
      setAutocompleteSuggestions([]);
    },
    [onChange]
  );

  // Get smart suggestions for this field
  const fieldSuggestions = smartForm.suggestions[fieldName] || [];

  // Combine autocomplete and smart suggestions
  const allSuggestions = useMemo(() => {
    const combined = [...autocompleteSuggestions];

    // Add smart suggestions that aren't already in autocomplete
    for (const smart of fieldSuggestions) {
      if (!combined.includes(smart.value)) {
        combined.push(smart.value);
      }
    }

    return combined.slice(0, 8); // Limit to 8 suggestions
  }, [autocompleteSuggestions, fieldSuggestions]);

  return {
    // State
    showSuggestions: showSuggestions && allSuggestions.length > 0,
    suggestions: allSuggestions,
    loading,
    isActive: smartForm.activeField === fieldName,

    // Handlers
    handleChange,
    handleFocus,
    handleBlur,
    handleSuggestionSelect,

    // Apply smart suggestion
    applySuggestion: smartForm.applySuggestion,

    // Get field issues
    fieldIssues: smartForm.validationIssues.filter(
      (issue) => issue.field === fieldName
    ),

    // Get field smart suggestions
    smartSuggestions: fieldSuggestions,
  };
}
