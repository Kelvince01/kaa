import { useMutation } from "@tanstack/react-query";
import type { Property } from "../properties";
import {
  analyzePropertyImages,
  generatePropertyDescription,
  suggestPricing,
} from "./ai.service";
import type { AIGenerationOptions } from "./ai.type";

// Generate property description
export const useGeneratePropertyDescription = () =>
  useMutation({
    mutationFn: ({
      propertyData,
      options,
    }: {
      propertyData: Partial<Property>;
      options: AIGenerationOptions;
    }) => generatePropertyDescription(propertyData, options),
  });

// Analyze property images
export const useAnalyzePropertyImages = () =>
  useMutation({
    mutationFn: analyzePropertyImages,
  });

// Get AI pricing suggestions
export const useSuggestPricing = () =>
  useMutation({
    mutationFn: suggestPricing,
  });
