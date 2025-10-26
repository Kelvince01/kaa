"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@kaa/ui/components/button";
import { Card } from "@kaa/ui/components/card";
import { Form } from "@kaa/ui/components/form";
import { ChevronLeft, ChevronRight, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Step, Stepper, useStepper } from "@/components/common/stepper";
import { useFormWithDraft } from "@/hooks/use-draft-form";
import { useCreateProperty } from "../../property.mutations";
import {
  defaultPropertyValues,
  type PropertyFormData,
  propertyFormSchema,
  propertyFormSteps,
  type StepId,
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

function StepperFooter() {
  const { nextStep, prevStep, isLastStep, activeStep } = useStepper();

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <Button
        disabled={activeStep === 0}
        onClick={prevStep}
        size="sm"
        type="button"
        variant="outline"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Previous
      </Button>
      <div className="text-muted-foreground text-sm">
        Step {activeStep + 1} of {propertyFormSteps.length}
      </div>
      <Button onClick={nextStep} size="sm" type="button">
        {isLastStep ? "Review" : "Next"}
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function PropertyFormContent() {
  const router = useRouter();
  const createPropertyMutation = useCreateProperty();

  const form = useFormWithDraft<PropertyFormData>("property-form", {
    formOptions: {
      resolver: zodResolver(propertyFormSchema),
      defaultValues: defaultPropertyValues,
      mode: "onChange",
    },
  });

  const onSubmit = async (data: PropertyFormData) => {
    try {
      await createPropertyMutation.mutateAsync(data);

      toast.success("Property submitted successfully!", {
        description: "Your property is now under review",
      });

      // Clear draft
      form.reset();

      // Redirect to properties list
      router.push("/dashboard/properties");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit property", {
        description:
          "Please try again or contact support if the problem persists",
      });
    }
  };

  const handleSaveDraft = () => {
    toast.success("Draft saved", {
      description: "Your progress has been saved automatically",
    });
  };

  if (form.loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading your draft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Unsaved Changes Indicator */}
      {form.unsavedChanges && (
        <Card className="border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950/20">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
              <Save className="h-4 w-4" />
              <span>You have unsaved changes (auto-saved as draft)</span>
            </div>
            <Button
              className="text-xs"
              onClick={handleSaveDraft}
              size="sm"
              variant="outline"
            >
              <Save className="mr-1 h-3 w-3" />
              Saved
            </Button>
          </div>
        </Card>
      )}

      {/* Form Content */}
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <Stepper initialStep={0} steps={propertyFormSteps as any}>
            {propertyFormSteps.map((step, index) => {
              const StepComponent = STEP_COMPONENTS[step.id as StepId];
              return (
                <Step key={step.id} label={step.label}>
                  <Card className="p-6 md:p-8">
                    <StepComponent />
                  </Card>

                  {/* Navigation */}
                  <div className="mt-6">
                    {index === propertyFormSteps.length - 1 ? (
                      <SubmitFooter form={form} />
                    ) : (
                      <StepperFooter />
                    )}
                  </div>
                </Step>
              );
            })}
          </Stepper>
        </form>
      </Form>

      {/* Help Text */}
      <Card className="bg-muted/50 p-4">
        <p className="text-center text-muted-foreground text-sm">
          Need help? Contact support or check our{" "}
          <a className="text-primary hover:underline" href="/help">
            property listing guide
          </a>
        </p>
      </Card>
    </div>
  );
}

function SubmitFooter({ form }: { form: any }) {
  const { prevStep, activeStep } = useStepper();

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <Button onClick={prevStep} size="sm" type="button" variant="outline">
        <ChevronLeft className="mr-2 h-4 w-4" />
        Previous
      </Button>
      <div className="text-muted-foreground text-sm">
        Step {activeStep + 1} of {propertyFormSteps.length}
      </div>
      <Button disabled={!form.formState.isValid} size="sm" type="submit">
        <Send className="mr-2 h-4 w-4" />
        Submit Property
      </Button>
    </div>
  );
}

export function PropertyForm() {
  return <PropertyFormContent />;
}
