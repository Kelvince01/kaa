"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Form } from "@kaa/ui/components/form";
import { Progress } from "@kaa/ui/components/progress";
import { cn } from "@kaa/ui/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Save,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Step, Stepper, useStepper } from "@/components/common/stepper";
import type { StepItem } from "@/components/common/stepper/types";
import { useBeforeUnload } from "@/hooks/use-before-unload";
import { useFormWithDraft } from "@/hooks/use-draft-form";
import useMounted from "@/hooks/use-mounted";
import { useCreateProperty } from "../../property.mutations";
import {
  defaultPropertyValues,
  getStepProgress,
  type PropertyFormData,
  propertyFormSchema,
  propertyFormSteps,
} from "./schema";
import {
  AmenitiesStep,
  AvailabilityStep,
  BasicInfoStep,
  LocationStep,
  MediaStep,
  PricingStep,
  ReviewStep,
  RulesStep,
  SpecificationsStep,
} from "./steps";

// Map step IDs to components
const STEP_COMPONENTS = {
  basic: BasicInfoStep,
  location: LocationStep,
  specifications: SpecificationsStep,
  pricing: PricingStep,
  amenities: AmenitiesStep,
  media: MediaStep,
  availability: AvailabilityStep,
  rules: RulesStep,
  review: ReviewStep,
};

// Footer component for step navigation
function StepperFooter() {
  const {
    nextStep,
    prevStep,
    resetSteps,
    isDisabledStep,
    hasCompletedAllSteps,
    isLastStep,
    isOptionalStep,
    activeStep,
  } = useStepper();

  return (
    <div className="flex w-full justify-between gap-2">
      {activeStep > 0 && (
        <Button
          disabled={isDisabledStep}
          onClick={prevStep}
          size="sm"
          type="button"
          variant="secondary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
      )}
      <div className="flex-1" />
      {isLastStep ? null : (
        <Button onClick={nextStep} size="sm" type="button">
          {isOptionalStep ? "Skip" : "Continue"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

type PropertyFormV3Props = {
  onSubmit?: (data: PropertyFormData) => Promise<void>;
  initialValues?: Partial<PropertyFormData>;
};

export function PropertyFormV3({
  onSubmit: onSubmitProp,
  initialValues,
}: PropertyFormV3Props) {
  const router = useRouter();
  const { hasStarted } = useMounted();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const createPropertyMutation = useCreateProperty();

  // Initialize form with draft support
  const form = useFormWithDraft<PropertyFormData>("property-form-v3", {
    formOptions: {
      resolver: zodResolver(propertyFormSchema),
      defaultValues: {
        ...defaultPropertyValues,
        ...initialValues,
      } as PropertyFormData,
    },
    onUnsavedChanges: () => {
      // Could show a notification here
    },
  });

  const formValues = form.watch();

  // Prevent navigation with unsaved changes
  useBeforeUnload({
    when: form.unsavedChanges && !submitSuccess,
    message: "You have unsaved changes. Are you sure you want to leave?",
  });

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const validSteps = propertyFormSteps.filter((s) => s.id !== "review");
    const totalProgress = validSteps.reduce(
      (acc, step) => acc + getStepProgress(step.id, formValues),
      0
    );
    return Math.round(totalProgress / validSteps.length);
  }, [formValues]);

  // Step items for the stepper
  const stepItems: StepItem[] = useMemo(
    () =>
      propertyFormSteps.map((step) => ({
        id: step.id,
        label: step.label,
        description: step.description,
      })),
    []
  );

  const handleSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);
    try {
      // Call custom onSubmit if provided
      if (onSubmitProp) {
        await onSubmitProp(data);
      } else {
        // Default submission logic
        console.log("Property Form Data:", data);

        await createPropertyMutation.mutateAsync(data);

        setSubmitSuccess(true);
        form.reset(data); // Clear unsaved changes
      }
    } catch (error) {
      console.error("Submission error:", error);
      // Show error notification
    } finally {
      setIsSubmitting(false);
    }
  };

  const animateClass = `transition-all will-change-transform duration-500 ease-out ${
    hasStarted ? "opacity-100" : "opacity-0 scale-95 translate-y-4"
  }`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className={cn("space-y-6", animateClass)}>
            {/* Header with Progress */}
            <Card className="border-blue-200 bg-linear-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      List Your Property
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Fill in the details to create your listing
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    {form.unsavedChanges && !submitSuccess && (
                      <Badge className="gap-1" variant="secondary">
                        <Save className="h-3 w-3" />
                        Auto-saving...
                      </Badge>
                    )}
                    {form.loading ? (
                      <Badge variant="outline">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Loading draft...
                      </Badge>
                    ) : overallProgress > 0 ? (
                      <Badge variant="default">
                        {overallProgress}% Complete
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="pt-2">
                  <Progress className="h-2" value={overallProgress} />
                </div>
              </CardHeader>
            </Card>

            {/* Stepper */}
            <Stepper
              initialStep={0}
              orientation="horizontal"
              responsive
              steps={stepItems}
              variant="circle-alt"
            >
              {propertyFormSteps.map((stepConfig, index) => {
                const StepComponent =
                  STEP_COMPONENTS[
                    stepConfig.id as keyof typeof STEP_COMPONENTS
                  ];

                return (
                  <Step
                    description={stepConfig.description}
                    key={stepConfig.id}
                    label={stepConfig.label}
                  >
                    <Card className="mt-6">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {stepConfig.label}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {stepConfig.description}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">
                            Step {index + 1} of {propertyFormSteps.length}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {stepConfig.id === "review" ? (
                          <ReviewStep
                            form={form}
                            onEdit={() => {
                              // Navigate to specific step for editing
                              // This would require access to stepper context
                            }}
                          />
                        ) : (
                          StepComponent && (
                            <StepComponent
                              form={form}
                              onEdit={() => {
                                // Navigate to specific step for editing
                                // This would require access to stepper context
                              }}
                            />
                          )
                        )}

                        {/* Navigation Footer */}
                        <div className="border-t pt-4">
                          {index === propertyFormSteps.length - 1 ? (
                            <div className="flex w-full gap-2">
                              <StepperFooter />
                              <Button
                                className="ml-auto"
                                disabled={
                                  isSubmitting ||
                                  Object.keys(form.formState.errors).length > 0
                                }
                                size="sm"
                                type="submit"
                              >
                                {isSubmitting ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Submit Listing
                                  </>
                                )}
                              </Button>
                            </div>
                          ) : (
                            <StepperFooter />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Step>
                );
              })}
            </Stepper>

            {/* Success State */}
            {submitSuccess && (
              <Card className="border-green-200 bg-linear-to-br from-green-50 to-white dark:from-green-950 dark:to-background">
                <CardContent className="flex flex-col items-center py-8">
                  <div className="rounded-full bg-green-100 p-4 dark:bg-green-900">
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  </div>
                  <h3 className="mt-4 font-bold text-xl">
                    Listing Submitted Successfully!
                  </h3>
                  <p className="mt-2 text-center text-muted-foreground">
                    Your property has been submitted for review. You'll be
                    redirected shortly.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
