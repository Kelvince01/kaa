import { Badge } from "@kaa/ui/components/badge";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Progress } from "@kaa/ui/components/progress";
import { cn } from "@kaa/ui/lib/utils";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Info,
  Star,
  TrendingUp,
} from "lucide-react";
import type {
  StepValidationMap,
  ValidationResult,
} from "../hooks/use-step-validation";

type StepProgressProps = {
  stepValidations: StepValidationMap;
  currentStep: string;
  overallCompletion: number;
  className?: string;
};

export function StepProgress({
  stepValidations,
  currentStep,
  overallCompletion,
  className,
}: StepProgressProps) {
  const getStepIcon = (_stepId: string, validation: ValidationResult) => {
    if (validation.isValid && validation.completionScore >= 80) {
      return <Star className="h-4 w-4 text-yellow-500" />;
    }
    if (validation.isValid && validation.completionScore >= 60) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (validation.isValid) {
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
    if (validation.errors.length > 0) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return <Clock className="h-4 w-4 text-gray-400" />;
  };

  const getStepBadgeVariant = (
    _stepId: string,
    validation: ValidationResult
  ) => {
    if (validation.isValid && validation.completionScore >= 80)
      return "default";
    if (validation.isValid && validation.completionScore >= 60)
      return "secondary";
    if (validation.isValid) return "outline";
    if (validation.errors.length > 0) return "destructive";
    return "secondary";
  };

  const stepLabels = {
    basic: "Basic Info",
    location: "Location",
    details: "Details",
    features: "Features",
    media: "Media",
    pricing: "Pricing",
    availability: "Availability",
    completed: "Review",
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="p-4">
        {/* Overall Progress */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium text-sm">Overall Completion</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-bold text-sm">{overallCompletion}%</span>
            </div>
          </div>
          <Progress className="h-2" value={overallCompletion} />
        </div>

        {/* Step Progress */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 text-sm">Step Progress</h4>

          {Object.entries(stepValidations).map(([stepId, validation]) => (
            <div
              className={cn(
                "flex items-center justify-between rounded-lg border p-2 transition-colors",
                currentStep === stepId
                  ? "border-primary/20 bg-primary/5"
                  : "border-gray-100",
                "hover:bg-gray-50"
              )}
              key={stepId}
            >
              <div className="flex items-center gap-3">
                {getStepIcon(stepId, validation)}
                <div>
                  <span
                    className={cn(
                      "font-medium text-sm",
                      currentStep === stepId ? "text-primary" : "text-gray-700"
                    )}
                  >
                    {stepLabels[stepId as keyof typeof stepLabels]}
                  </span>
                  {validation.warnings.length > 0 && (
                    <div className="mt-1 flex items-center gap-1">
                      <Info className="h-3 w-3 text-amber-500" />
                      <span className="text-amber-600 text-xs">
                        {validation.warnings.length} suggestion
                        {validation.warnings.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  className="text-xs"
                  variant={getStepBadgeVariant(stepId, validation)}
                >
                  {validation.completionScore}%
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Current Step Details */}
        {currentStep && stepValidations[currentStep] && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3">
            <h5 className="mb-2 font-medium text-sm">
              {stepLabels[currentStep as keyof typeof stepLabels]} Status
            </h5>

            {stepValidations[currentStep].errors.length > 0 && (
              <div className="mb-2">
                <div className="mb-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-red-500" />
                  <span className="font-medium text-red-700 text-xs">
                    Required
                  </span>
                </div>
                <ul className="ml-4 space-y-1 text-red-600 text-xs">
                  {stepValidations[currentStep].errors.map((error, index) => (
                    <li key={index.toString()}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {stepValidations[currentStep].warnings.length > 0 && (
              <div>
                <div className="mb-1 flex items-center gap-1">
                  <Info className="h-3 w-3 text-amber-500" />
                  <span className="font-medium text-amber-700 text-xs">
                    Suggestions
                  </span>
                </div>
                <ul className="ml-4 space-y-1 text-amber-600 text-xs">
                  {stepValidations[currentStep].warnings.map(
                    (warning, index) => (
                      <li key={index.toString()}>• {warning}</li>
                    )
                  )}
                </ul>
              </div>
            )}

            {stepValidations[currentStep].isValid &&
              stepValidations[currentStep].warnings.length === 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-green-700 text-xs">
                    This step looks great!
                  </span>
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
