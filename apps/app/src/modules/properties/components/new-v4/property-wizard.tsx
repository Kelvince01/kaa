"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card } from "@kaa/ui/components/card";
import { Form } from "@kaa/ui/components/form";
import { Progress } from "@kaa/ui/components/progress";
import { cn } from "@kaa/ui/lib/utils";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Save,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCreateProperty } from "../../property.mutations";
import {
  defaultPropertyValues,
  type PropertyFormData,
  propertyFormSchema,
  propertyFormSteps,
  type StepId,
  stepSchemas,
  transformToCreatePropertyData,
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

type PropertyWizardProps = {
  onComplete?: (property: any) => void;
  onCancel?: () => void;
};

export function PropertyWizard({ onComplete, onCancel }: PropertyWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const createPropertyMutation = useCreateProperty();

  // Initialize form
  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: defaultPropertyValues,
    mode: "onChange",
  });

  // Get current step info
  const currentStepId = propertyFormSteps[currentStep]?.id as StepId;
  const isLastStep = currentStep === propertyFormSteps.length - 1;
  const isFirstStep = currentStep === 0;

  // Validate current step
  const validateCurrentStep = async () => {
    const stepId = propertyFormSteps[currentStep]?.id as Exclude<
      StepId,
      "review"
    >;

    if (stepId === ("review" as StepId)) return true;

    const schema = stepSchemas[stepId];
    const stepData = getStepData(stepId);

    try {
      await schema.parseAsync(stepData);
      return true;
    } catch {
      return false;
    }
  };

  // Get step data for validation
  const getStepData = (stepId: Exclude<StepId, "review">) => {
    const formData = form.getValues();

    switch (stepId) {
      case "basic":
        return {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          furnished: formData.furnished,
          tags: formData.tags,
        };
      case "location":
        return {
          county: formData.county,
          estate: formData.estate,
          address: formData.address,
          coordinates: formData.coordinates,
          nearbyAmenities: formData.nearbyAmenities,
          plotNumber: formData.plotNumber,
          buildingName: formData.buildingName,
        };
      case "specifications":
        return {
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          totalArea: formData.totalArea,
          condition: formData.condition,
        };
      case "pricing":
        return {
          rent: formData.rent,
          deposit: formData.deposit,
          serviceFee: formData.serviceFee,
          paymentFrequency: formData.paymentFrequency,
          advanceMonths: formData.advanceMonths,
          depositMonths: formData.depositMonths,
        };
      case "amenities":
        return {
          amenities: formData.amenities,
        };
      case "media":
        return {
          images: formData.images,
        };
      case "availability":
        return {
          availableFrom: formData.availableFrom,
          viewingContact: formData.viewingContact,
        };
      case "rules":
        return {
          petsAllowed: formData.petsAllowed,
          minimumLease: formData.minimumLease,
        };
      default:
        return {};
    }
  };

  // Calculate step status
  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.has(stepIndex)) {
      return "completed";
    }
    if (stepIndex === currentStep) {
      return "current";
    }
    if (stepIndex < currentStep) {
      return "visited";
    }
    return "upcoming";
  };

  // Handle next step
  const handleNext = async () => {
    const isValid = await validateCurrentStep();

    if (!isValid) {
      toast.error("Please complete all required fields");
      return;
    }

    // Mark current step as completed
    setCompletedSteps((prev) => new Set(prev).add(currentStep));

    // Move to next step
    if (currentStep < propertyFormSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle step navigation
  const handleStepClick = (stepIndex: number) => {
    // Can only go to completed steps or next step
    if (completedSteps.has(stepIndex) || stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle edit from review
  const handleEdit = (stepId: string) => {
    const stepIndex = propertyFormSteps.findIndex((s) => s.id === stepId);
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle form submission
  const onSubmit = async (data: PropertyFormData) => {
    try {
      const createPropertyData = transformToCreatePropertyData(data);
      const property =
        await createPropertyMutation.mutateAsync(createPropertyData);

      toast.success("Property submitted successfully!", {
        description: "Your property is now under review",
      });

      onComplete?.(property);
      router.push("/dashboard/properties");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit property", {
        description: "Please try again or contact support",
      });
    }
  };

  // Calculate overall progress
  const overallProgress = Math.round(
    (completedSteps.size / propertyFormSteps.length) * 100
  );

  // Render step icon
  const getStepIcon = (stepIndex: number) => {
    const status = getStepStatus(stepIndex);

    if (status === "completed") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (status === "current") {
      return <Clock className="h-4 w-4 text-primary" />;
    }
    return (
      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
    );
  };

  // Render current step content
  const renderStepContent = () => {
    const StepComponent = STEP_COMPONENTS[currentStepId];

    if (currentStepId === "review") {
      return <ReviewStep onEdit={handleEdit} />;
    }

    return <StepComponent />;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl md:text-3xl">
              List Your Property
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Step {currentStep + 1} of {propertyFormSteps.length}
            </p>
          </div>

          <Badge className="gap-1" variant="secondary">
            <CheckCircle className="h-3 w-3" />
            {overallProgress}% Complete
          </Badge>
        </div>

        {/* Overall Progress */}
        <Progress className="h-2" value={overallProgress} />
      </div>

      {/* Step Navigator */}
      <Card className="p-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {propertyFormSteps.map((step, index) => (
            <div className="flex items-center" key={step.id}>
              <button
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left transition-all",
                  getStepStatus(index) === "current"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                  getStepStatus(index) === "completed"
                    ? "cursor-pointer"
                    : getStepStatus(index) === "upcoming"
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                )}
                disabled={getStepStatus(index) === "upcoming"}
                onClick={() => handleStepClick(index)}
                type="button"
              >
                {getStepIcon(index)}
                <div className="hidden md:block">
                  <p className="font-medium text-sm">{step.label}</p>
                  <p className="text-xs opacity-80">{step.description}</p>
                </div>
                <div className="md:hidden">
                  <p className="font-medium text-xs">{step.icon}</p>
                </div>
              </button>

              {index < propertyFormSteps.length - 1 && (
                <ChevronRight className="mx-1 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Form Content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="p-6 md:p-8">
            {/* Step Header */}
            <div className="mb-6 flex items-center gap-3">
              <span className="text-3xl">
                {propertyFormSteps[currentStep]?.icon}
              </span>
              <div>
                <h2 className="font-semibold text-xl">
                  {propertyFormSteps[currentStep]?.label}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {propertyFormSteps[currentStep]?.description}
                </p>
              </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">{renderStepContent()}</div>

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between gap-4">
              <Button
                disabled={isFirstStep}
                onClick={handlePrevious}
                size="lg"
                type="button"
                variant="outline"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <div className="flex gap-2">
                {onCancel && (
                  <Button
                    onClick={onCancel}
                    size="lg"
                    type="button"
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                )}

                {isLastStep ? (
                  <Button
                    disabled={createPropertyMutation.isPending}
                    size="lg"
                    type="submit"
                  >
                    {createPropertyMutation.isPending ? (
                      <>
                        <Save className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Property
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleNext} size="lg" type="button">
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
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
