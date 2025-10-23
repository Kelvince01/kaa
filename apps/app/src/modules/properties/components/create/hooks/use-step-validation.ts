import { useCallback, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormData } from "../schema";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completionScore: number;
};

export type StepValidationMap = {
  [stepId: string]: ValidationResult;
};

export function useStepValidation(form: UseFormReturn<PropertyFormData>) {
  const { formState, watch, getValues } = form;
  const formData = watch();

  const validateBasicStep = useCallback((): ValidationResult => {
    const { basic } = formData;
    const errors: string[] = [];
    const warnings: string[] = [];
    let completionScore = 0;

    // Required validations
    if (!basic?.title || basic.title.length < 5) {
      errors.push("Title must be at least 5 characters");
    } else {
      completionScore += 25;
      if (basic.title.length > 50) completionScore += 10; // Bonus for detailed title
    }

    if (!basic?.description || basic.description.length < 20) {
      errors.push("Description must be at least 20 characters");
    } else {
      completionScore += 25;
      if (basic.description.length > 100) completionScore += 10; // Bonus for detailed description
    }

    if (basic?.type) {
      completionScore += 25;
    } else {
      errors.push("Property type is required");
    }

    // Quality warnings
    if (basic?.title && basic.title.length < 20) {
      warnings.push(
        "Consider adding more detail to your title for better visibility"
      );
    }

    if (basic?.description && basic.description.length < 50) {
      warnings.push("Longer descriptions typically get more inquiries");
    }

    // SEO scoring
    if (basic?.title && basic?.description) {
      const titleWords = basic.title.toLowerCase().split(" ");
      const descWords = basic.description.toLowerCase().split(" ");
      const commonKeywords = [
        "apartment",
        "house",
        "studio",
        "bedroom",
        "bathroom",
      ];

      const hasKeywords = commonKeywords.some(
        (keyword) => titleWords.includes(keyword) || descWords.includes(keyword)
      );

      if (hasKeywords) {
        completionScore += 15;
      } else {
        warnings.push(
          "Include property type keywords for better search visibility"
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completionScore: Math.min(completionScore, 100),
    };
  }, [formData]);

  const validateMediaStep = useCallback((): ValidationResult => {
    const { media } = formData;
    const errors: string[] = [];
    const warnings: string[] = [];
    let completionScore = 0;

    // Required validations
    if (!media?.photos || media.photos.length === 0) {
      errors.push("At least one photo is required");
    } else {
      completionScore += 40;

      // Bonus scoring for photo quality
      if (media.photos.length >= 5) completionScore += 20;
      if (media.photos.length >= 10) completionScore += 10;

      const hasPrimaryPhoto = media.photos.some((photo) => photo.isPrimary);
      if (hasPrimaryPhoto) {
        completionScore += 15;
      } else {
        warnings.push("Set a primary photo to attract more viewers");
      }

      // Check for photo captions
      const photosWithCaptions = media.photos.filter((photo) => photo.caption);
      if (photosWithCaptions.length > 0) {
        completionScore += 10;
      } else {
        warnings.push(
          "Add captions to photos for better accessibility and SEO"
        );
      }
    }

    // Quality warnings
    if (media?.photos && media.photos.length < 5) {
      warnings.push("Properties with 5+ photos get 40% more inquiries");
    }

    if (media?.virtualTour) {
      completionScore += 15;
    } else {
      warnings.push("Virtual tours increase viewing time by 3x");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completionScore: Math.min(completionScore, 100),
    };
  }, [formData]);

  const validateLocationStep = useCallback((): ValidationResult => {
    const { location } = formData;
    const errors: string[] = [];
    const warnings: string[] = [];
    let completionScore = 0;

    // Required validations
    if (location?.county) {
      completionScore += 25;
    } else {
      errors.push("County is required");
    }

    if (location?.address?.line1) {
      completionScore += 25;
    } else {
      errors.push("Address line 1 is required");
    }

    if (location?.address?.town) {
      completionScore += 25;
    } else {
      errors.push("Town is required");
    }

    if (location?.address?.postalCode) {
      completionScore += 25;
    } else {
      errors.push("Postal code is required");
    }

    // Quality bonuses
    if (location?.constituency) {
      completionScore += 10;
    } else {
      warnings.push("Adding constituency helps with local search");
    }

    if (location?.address?.line2) {
      completionScore += 10;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completionScore: Math.min(completionScore, 100),
    };
  }, [formData]);

  const validateDetailsStep = useCallback((): ValidationResult => {
    const { details } = formData;
    const errors: string[] = [];
    const warnings: string[] = [];
    let completionScore = 0;

    // Basic validations
    if (details?.bedrooms !== undefined && details.bedrooms >= 0) {
      completionScore += 30;
    }

    if (details?.bathrooms !== undefined && details.bathrooms >= 0) {
      completionScore += 30;
    }

    if (details?.size && details.size > 0) {
      completionScore += 40;
    } else {
      warnings.push("Property size helps tenants make informed decisions");
    }

    // Logical validations
    if (
      details?.bedrooms &&
      details?.bathrooms &&
      details.bathrooms > details.bedrooms + 2
    ) {
      warnings.push("Unusual bathroom to bedroom ratio - please verify");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completionScore: Math.min(completionScore, 100),
    };
  }, [formData]);

  const validatePricingStep = useCallback((): ValidationResult => {
    const { pricing } = formData;
    const errors: string[] = [];
    const warnings: string[] = [];
    let completionScore = 0;

    // Required validations
    if (!pricing?.rentAmount || pricing.rentAmount <= 0) {
      errors.push("Rent amount must be greater than 0");
    } else {
      completionScore += 25;
    }

    if (pricing?.currency) {
      completionScore += 15;
    } else {
      errors.push("Currency is required");
    }

    if (pricing?.paymentFrequency) {
      completionScore += 15;
    } else {
      errors.push("Payment frequency is required");
    }

    if (!pricing?.securityDeposit || pricing.securityDeposit <= 0) {
      errors.push("Security deposit must be greater than 0");
    } else {
      completionScore += 20;

      // Validate reasonable deposit ratio
      if (
        pricing.rentAmount &&
        pricing.securityDeposit > pricing.rentAmount * 3
      ) {
        warnings.push(
          "Security deposit seems high - consider market standards"
        );
      }
    }

    // Quality bonuses
    if (pricing?.serviceCharge && pricing.serviceCharge > 0) {
      completionScore += 10;
    }

    if (pricing?.utilitiesIncluded && pricing.utilitiesIncluded.length > 0) {
      completionScore += 10;
    } else {
      warnings.push("Specify included utilities for transparency");
    }

    if (pricing?.negotiable !== undefined) {
      completionScore += 5;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completionScore: Math.min(completionScore, 100),
    };
  }, [formData]);

  const stepValidations = useMemo(
    (): StepValidationMap => ({
      basic: validateBasicStep(),
      location: validateLocationStep(),
      details: validateDetailsStep(),
      features: {
        isValid: true,
        errors: [],
        warnings: [],
        completionScore: 100,
      }, // TODO: implement features validation
      media: validateMediaStep(),
      pricing: validatePricingStep(),
      availability: {
        isValid: true,
        errors: [],
        warnings: [],
        completionScore: 100,
      }, // TODO: implement availability validation
      completed: {
        isValid: true,
        errors: [],
        warnings: [],
        completionScore: 100,
      }, // Always valid for review step
    }),
    [
      validateBasicStep,
      validateLocationStep,
      validateDetailsStep,
      validateMediaStep,
      validatePricingStep,
    ]
  );

  const overallCompletion = useMemo(() => {
    const scores = Object.values(stepValidations).map((v) => v.completionScore);
    return Math.round(
      scores.reduce((sum, score) => sum + score, 0) / scores.length
    );
  }, [stepValidations]);

  const canAdvanceToStep = useCallback(
    (stepId: string): boolean => {
      const stepOrder = [
        "basic",
        "location",
        "details",
        "features",
        "media",
        "pricing",
        "availability",
        "completed",
      ];
      const currentStepIndex = stepOrder.indexOf(stepId);
      if (currentStepIndex <= 0) return true;

      const previousStepId = stepOrder[currentStepIndex - 1];
      return (
        stepValidations[previousStepId as keyof StepValidationMap]?.isValid ??
        false
      );
    },
    [stepValidations]
  );

  const getStepStatus = useCallback(
    (stepId: string) => {
      const validation = stepValidations[stepId];
      if (!validation) return "pending";

      if (validation.isValid && validation.completionScore >= 80)
        return "excellent";
      if (validation.isValid && validation.completionScore >= 60) return "good";
      if (validation.isValid) return "valid";
      return "invalid";
    },
    [stepValidations]
  );

  return {
    stepValidations,
    overallCompletion,
    canAdvanceToStep,
    getStepStatus,
    isFormValid: Object.values(stepValidations).every((v) => v.isValid),
  };
}
