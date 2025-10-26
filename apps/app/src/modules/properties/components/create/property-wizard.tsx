import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@kaa/ui/components/tabs";
import { cn } from "@kaa/ui/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  HelpCircle,
  Save,
  Settings,
  Sparkles,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { AIAssistantPanel } from "./components/ai-assistant-panel";
import { SaveIndicator } from "./components/save-indicator";
import { StepProgress } from "./components/step-progress";
import { AvailabilityForm } from "./forms/availability";
// Import existing form components (enhanced versions)
// Import enhanced form components
import { EnhancedBasicInfoForm } from "./forms/basic-info-enhanced";
import { EnhancedCompletedForm } from "./forms/completed-enhanced";
import { DetailsForm } from "./forms/details";
import { FeaturesForm } from "./forms/features";
import { LocationForm } from "./forms/location";
import { MediaForm } from "./forms/media";
import { EnhancedPricingForm } from "./forms/pricing";
import { useEnhancedForm } from "./hooks/use-enhanced-form";
// Import our enhanced components
import { useStepValidation } from "./hooks/use-step-validation";

type EnhancedPropertyWizardProps = {
  propertyId?: string;
  onComplete?: (property: any) => void;
  className?: string;
};

export function EnhancedPropertyWizard({
  propertyId,
  onComplete,
  className,
}: EnhancedPropertyWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState("form");
  const [showPreview, setShowPreview] = useState(false);

  const steps = [
    { id: "basic", label: "Basic Info", icon: "📝" },
    { id: "location", label: "Location", icon: "📍" },
    { id: "details", label: "Details", icon: "🏠" },
    { id: "features", label: "Features", icon: "⭐" },
    { id: "media", label: "Media", icon: "📸" },
    { id: "pricing", label: "Pricing", icon: "💰" },
    { id: "availability", label: "Availability", icon: "📅" },
    { id: "completed", label: "Review", icon: "✅" },
  ];

  // Enhanced form with auto-save and optimistic updates
  const {
    form,
    formState,
    save,
    saveNow,
    recoverFromDraft,
    discardChanges,
    isLoading,
  } = useEnhancedForm({
    propertyId,
    onSuccess: onComplete,
  });

  // Smart validation with real-time feedback
  const {
    stepValidations,
    overallCompletion,
    canAdvanceToStep,
    getStepStatus,
    isFormValid,
  } = useStepValidation(form);

  const currentStepId = steps[currentStep]?.id;
  const currentValidation =
    stepValidations[currentStepId as keyof typeof stepValidations];

  const handleStepChange = useCallback(
    (newStep: number) => {
      const targetStepId = steps[newStep]?.id;

      if (newStep > currentStep && !canAdvanceToStep(targetStepId as string)) {
        toast.error("Please complete the current step before proceeding");
        return;
      }

      setCurrentStep(newStep);
    },
    [currentStep, canAdvanceToStep]
  );

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      handleStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      handleStepChange(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (!isFormValid) {
      toast.error("Please complete all required fields");
      return;
    }

    try {
      await save();
      toast.success("Property saved successfully!");
    } catch (error) {
      toast.error("Failed to save property");
    }
  };

  const getStepIcon = (stepIndex: number) => {
    const stepId = steps[stepIndex]?.id;
    const status = getStepStatus(stepId as string);

    if (status === "excellent")
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === "good")
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    if (status === "valid")
      return <CheckCircle className="h-4 w-4 text-gray-500" />;
    if (status === "invalid")
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    return <div className="h-4 w-4 rounded-full bg-gray-300" />;
  };

  const renderStepContent = () => {
    const stepId = steps[currentStep]?.id;
    const formData = form.watch();

    switch (stepId) {
      case "basic":
        return (
          <EnhancedBasicInfoForm
            defaultValues={formData.basic}
            onNext={handleNext}
            onSubmit={(data) => {
              form.setValue("basic", data);
              saveNow();
            }}
          />
        );

      case "location":
        return (
          <LocationForm
            defaultValues={formData.location}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSubmit={(data) => {
              form.setValue("location", {
                ...data,
                address: {
                  line1: data.addressLine1,
                  town: data.city,
                  postalCode: data.postalCode,
                },
              });
              saveNow();
            }}
          />
        );

      case "details":
        return (
          <DetailsForm
            defaultValues={formData.details}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSubmit={(data) => {
              form.setValue("details", data);
              saveNow();
            }}
          />
        );

      case "features":
        return (
          <FeaturesForm
            defaultValues={formData.features}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSubmit={(data) => {
              form.setValue("features", data as any);
              saveNow();
            }}
          />
        );

      case "media":
        return (
          <MediaForm
            defaultValues={formData.media as any}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSubmit={(data) => {
              form.setValue("media", data as any);
              saveNow();
            }}
          />
        );

      case "pricing":
        return (
          <EnhancedPricingForm
            defaultValues={formData.pricing as any}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSubmit={(data) => {
              form.setValue("pricing", data as any);
              saveNow();
            }}
            propertyData={form.watch()}
          />
        );

      case "availability":
        return (
          <AvailabilityForm
            defaultValues={formData.availability}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSubmit={(data) => {
              form.setValue("availability", data as any);
              saveNow();
            }}
          />
        );

      case "completed":
        return (
          <EnhancedCompletedForm
            data={formData as any}
            isSubmitting={isLoading}
            onEdit={(step) => {
              const stepIndex = steps.findIndex((s) => s.id === step);
              if (stepIndex !== -1) {
                setCurrentStep(stepIndex);
              }
            }}
            onPrevious={handlePrevious}
            onSubmit={handleFinish}
          />
        );

      default:
        return <div>Step not found</div>;
    }
  };

  return (
    <div className={cn("mx-auto max-w-7xl p-6", className)}>
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl">
              {propertyId ? "Edit Property" : "Create New Property"}
            </h1>
            <p className="text-gray-600">
              Step {currentStep + 1} of {steps.length}:{" "}
              {steps[currentStep]?.label}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <SaveIndicator
              formState={formState}
              onRecoverDraft={recoverFromDraft}
              onSaveNow={saveNow}
            />

            <Badge className="gap-1" variant="outline">
              <BarChart3 className="h-3 w-3" />
              {overallCompletion}% Complete
            </Badge>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <div className="mb-6 flex items-center justify-between">
          {steps.map((step, index) => (
            <div className="flex items-center" key={step.id}>
              <button
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
                  index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : canAdvanceToStep(step.id)
                      ? "cursor-pointer hover:bg-gray-100"
                      : "cursor-not-allowed opacity-50"
                )}
                disabled={!canAdvanceToStep(step.id) && index > currentStep}
                onClick={() => handleStepChange(index)}
                type="button"
              >
                {getStepIcon(index)}
                <span className="font-medium text-sm">{step.label}</span>
              </button>

              {index < steps.length - 1 && (
                <ChevronRight className="mx-2 h-4 w-4 text-gray-400" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left Sidebar - Progress & Help */}
        <div className="space-y-4">
          <StepProgress
            currentStep={currentStepId as string}
            overallCompletion={overallCompletion}
            stepValidations={stepValidations}
          />

          {/* Quick Help */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <HelpCircle className="h-4 w-4" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 text-gray-600 text-xs">
                {currentStepId === "general" && (
                  <>
                    <p>• Use descriptive titles with 5+ words</p>
                    <p>• Include property type in description</p>
                    <p>• Mention key features and location</p>
                  </>
                )}
                {currentStepId === "media" && (
                  <>
                    <p>• Upload at least 5 high-quality photos</p>
                    <p>• Set a primary image for listings</p>
                    <p>• Add captions for better SEO</p>
                  </>
                )}
                {currentStepId === "location" && (
                  <>
                    <p>• Use the location picker for accuracy</p>
                    <p>• Include constituency for local search</p>
                    <p>• Verify postal code is correct</p>
                  </>
                )}
                {currentStepId === "details" && (
                  <>
                    <p>• Be accurate with room counts</p>
                    <p>• Include property size if known</p>
                    <p>• Consider accessibility features</p>
                  </>
                )}
                {currentStepId === "pricing" && (
                  <>
                    <p>• Research market rates in your area</p>
                    <p>• Consider included utilities</p>
                    <p>• Set reasonable security deposits</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <Tabs onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-6">
              <TabsTrigger className="gap-2" value="form">
                <Settings className="h-4 w-4" />
                Form
              </TabsTrigger>
              <TabsTrigger className="gap-2" value="ai">
                <Sparkles className="h-4 w-4" />
                AI Assistant
              </TabsTrigger>
              <TabsTrigger className="gap-2" value="preview">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="form">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{steps[currentStep]?.icon}</span>
                    {steps[currentStep]?.label}
                  </CardTitle>
                  {currentValidation && (
                    <div className="flex flex-wrap gap-2">
                      {currentValidation.errors.length > 0 && (
                        <Badge className="text-xs" variant="destructive">
                          {currentValidation.errors.length} error
                          {currentValidation.errors.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                      {currentValidation.warnings.length > 0 && (
                        <Badge className="text-xs" variant="outline">
                          {currentValidation.warnings.length} suggestion
                          {currentValidation.warnings.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                      <Badge className="text-xs" variant="secondary">
                        {currentValidation.completionScore}% complete
                      </Badge>
                    </div>
                  )}
                </CardHeader>
                <CardContent>{renderStepContent()}</CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai">
              <AIAssistantPanel
                onApplyDescription={(description) => {
                  form.setValue("basic.description", description);
                  toast.success("AI description applied!");
                  setActiveTab("form");
                }}
                onApplyPricing={(price) => {
                  form.setValue("pricing.rentAmount", price);
                  toast.success("AI pricing applied!");
                  setActiveTab("form");
                }}
                propertyData={form.watch()}
              />
            </TabsContent>

            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>Property Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="py-8 text-center text-gray-500">
                      <Eye className="mx-auto mb-4 h-16 w-16 opacity-50" />
                      <p>Property preview will appear here</p>
                      <p className="text-sm">
                        Complete more fields to see preview
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar - Validation & Actions */}
        <div className="space-y-4">
          {/* Current Step Validation */}
          {currentValidation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Step Status</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs">Completion</span>
                    <Badge
                      variant={
                        currentValidation.isValid ? "default" : "outline"
                      }
                    >
                      {currentValidation.completionScore}%
                    </Badge>
                  </div>

                  {currentValidation.errors.length > 0 && (
                    <div>
                      <h4 className="mb-1 font-medium text-red-700 text-xs">
                        Required
                      </h4>
                      <ul className="space-y-1">
                        {currentValidation.errors.map((error, index) => (
                          <li
                            className="flex items-start gap-1 text-red-600 text-xs"
                            key={index.toString()}
                          >
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentValidation.warnings.length > 0 && (
                    <div>
                      <h4 className="mb-1 font-medium text-amber-700 text-xs">
                        Suggestions
                      </h4>
                      <ul className="space-y-1">
                        {currentValidation.warnings.map((warning, index) => (
                          <li
                            className="flex items-start gap-1 text-amber-600 text-xs"
                            key={index.toString()}
                          >
                            <HelpCircle className="mt-0.5 h-3 w-3 shrink-0" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Button
                  className="w-full"
                  disabled={currentStep === 0}
                  onClick={handlePrevious}
                  variant="outline"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                {currentStep === steps.length - 1 ? (
                  <Button
                    className="w-full"
                    disabled={!isFormValid || isLoading}
                    onClick={handleFinish}
                  >
                    {isLoading ? (
                      <>
                        <Save className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Property
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={
                      !canAdvanceToStep(steps[currentStep + 1]?.id as string)
                    }
                    onClick={handleNext}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                <Button
                  className="w-full"
                  disabled={!formState.hasUnsavedChanges}
                  onClick={saveNow}
                  size="sm"
                  variant="ghost"
                >
                  <Save className="mr-2 h-3 w-3" />
                  Save Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
