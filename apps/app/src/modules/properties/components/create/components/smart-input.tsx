import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import { Card, CardContent } from "@kaa/ui/components/card";
import { Input } from "@kaa/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@kaa/ui/components/popover";
import { ScrollArea } from "@kaa/ui/components/scroll-area";
import { Textarea } from "@kaa/ui/components/textarea";
import { cn } from "@kaa/ui/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  Brain,
  Info,
  Loader2,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import type React from "react";
import { forwardRef, useState } from "react";
import { type useSmartForm, useSmartInput } from "../hooks/use-smart-form";

interface SmartInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  fieldName: string;
  smartForm: ReturnType<typeof useSmartForm>;
  showSuggestions?: boolean;
  enableAutoComplete?: boolean;
  label?: string;
  description?: string;
  error?: string;
}

interface SmartTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  fieldName: string;
  smartForm: ReturnType<typeof useSmartForm>;
  showSuggestions?: boolean;
  label?: string;
  description?: string;
  error?: string;
}

/*
import { useSmartForm } from './hooks/use-smart-form';
import { SmartInput, FormCompletionIndicator } from './components/smart-input';
import { EnhancedAIAssistantPanel } from './components/enhanced-ai-assistant-panel';
import { PropertyInsightsWidget } from './components/property-insights-widget';

// In your property form component:
const smartForm = useSmartForm(formData, updateField);

// Use smart inputs with AI assistance
<SmartInput
  fieldName="location.city"
  smartForm={smartForm}
  label="City"
  placeholder="Enter city name..."
/>

// Add the AI assistant panel
<EnhancedAIAssistantPanel
  propertyData={formData}
  onApplyDescription={applyDescription}
  onApplyPricing={applyPricing}
/>

// Show market insights
<PropertyInsightsWidget propertyData={formData} />
*/

// Smart Input component with AI assistance
export const SmartInput = forwardRef<HTMLInputElement, SmartInputProps>(
  (
    {
      fieldName,
      smartForm,
      showSuggestions = true,
      enableAutoComplete = true,
      label,
      description,
      error,
      className,
      value = "",
      onChange,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [localValue, setLocalValue] = useState(value as string);

    const {
      showSuggestions: showSmartSuggestions,
      suggestions,
      loading,
      isActive,
      handleChange,
      handleFocus,
      handleBlur,
      handleSuggestionSelect,
      applySuggestion,
      fieldIssues,
      smartSuggestions,
    } = useSmartInput(
      fieldName,
      localValue,
      (newValue) => {
        setLocalValue(newValue);
        onChange?.({
          target: { value: newValue },
        } as React.ChangeEvent<HTMLInputElement>);
      },
      smartForm
    );

    // Get the most severe issue for styling
    const severeIssue = fieldIssues.reduce((prev, current) => {
      if (current.severity === "error") return current;
      if (current.severity === "warning" && prev?.severity !== "error")
        return current;
      return prev;
    }, fieldIssues[0]);

    const getIssueIcon = (severity: string) => {
      switch (severity) {
        case "error":
          return <AlertTriangle className="h-4 w-4 text-red-500" />;
        case "warning":
          return <AlertCircle className="h-4 w-4 text-yellow-500" />;
        default:
          return <Info className="h-4 w-4 text-blue-500" />;
      }
    };

    const getBorderColor = () => {
      if (severeIssue) {
        switch (severeIssue.severity) {
          case "error":
            return "border-red-500 focus:border-red-500";
          case "warning":
            return "border-yellow-500 focus:border-yellow-500";
          default:
            return "border-blue-500 focus:border-blue-500";
        }
      }
      if (isActive) {
        return "border-purple-500 focus:border-purple-500";
      }
      return "";
    };

    return (
      <div className="space-y-2">
        {label && (
          <div className="flex items-center justify-between">
            <label className="font-medium text-sm" htmlFor={fieldName}>
              {label}
            </label>
            {isActive && smartSuggestions.length > 0 && (
              <Badge className="text-xs" variant="outline">
                <Brain className="mr-1 h-3 w-3" />
                AI suggestions
              </Badge>
            )}
          </div>
        )}

        <div className="relative">
          <Popover open={showSuggestions && showSmartSuggestions}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Input
                  className={cn(
                    className,
                    getBorderColor(),
                    "pr-10" // Space for status icon
                  )}
                  onBlur={(e) => {
                    handleBlur();
                    onBlur?.(e);
                  }}
                  onChange={(e) => handleChange(e.target.value)}
                  onFocus={(e) => {
                    handleFocus();
                    onFocus?.(e);
                  }}
                  ref={ref}
                  value={localValue}
                  {...props}
                />

                {/* Status icons */}
                <div className="-translate-y-1/2 absolute top-1/2 right-3 flex items-center gap-1">
                  {loading && (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  )}
                  {isActive && !loading && smartSuggestions.length > 0 && (
                    <Sparkles className="h-4 w-4 text-purple-500" />
                  )}
                  {severeIssue &&
                    !loading &&
                    getIssueIcon(severeIssue.severity)}
                </div>
              </div>
            </PopoverTrigger>

            <PopoverContent
              align="start"
              className="w-full p-0"
              side="bottom"
              sideOffset={4}
            >
              <div className="max-h-64 overflow-hidden">
                <ScrollArea className="max-h-64">
                  <div className="space-y-2 p-2">
                    {/* Autocomplete suggestions */}
                    {enableAutoComplete && suggestions.length > 0 && (
                      <div>
                        <div className="mb-1 px-2 font-medium text-gray-500 text-xs">
                          Suggestions
                        </div>
                        <div className="space-y-1">
                          {suggestions.map((suggestion, index) => (
                            <Button
                              className="h-auto w-full justify-start px-2 py-2 text-left"
                              key={index.toString()}
                              onClick={() => handleSuggestionSelect(suggestion)}
                              variant="ghost"
                            >
                              <div className="flex items-center gap-2">
                                <Target className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">{suggestion}</span>
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Smart AI suggestions */}
                    {smartSuggestions.length > 0 && (
                      <div>
                        {suggestions.length > 0 && (
                          <div className="my-2 border-t" />
                        )}
                        <div className="mb-1 px-2 font-medium text-gray-500 text-xs">
                          AI Recommendations
                        </div>
                        <div className="space-y-1">
                          {smartSuggestions
                            .slice(0, 3)
                            .map((suggestion, index) => (
                              <Button
                                className="h-auto w-full px-2 py-2 text-left"
                                key={index.toString()}
                                onClick={() => applySuggestion(suggestion)}
                                variant="ghost"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Brain className="h-3 w-3 text-purple-500" />
                                    <span className="font-medium text-sm">
                                      {suggestion.value}
                                    </span>
                                    <Badge
                                      className="ml-auto text-xs"
                                      variant="outline"
                                    >
                                      {Math.round(suggestion.confidence * 100)}%
                                    </Badge>
                                  </div>
                                  <div className="ml-5 text-gray-500 text-xs">
                                    {suggestion.reason}
                                  </div>
                                </div>
                              </Button>
                            ))}
                        </div>
                      </div>
                    )}

                    {!loading &&
                      suggestions.length === 0 &&
                      smartSuggestions.length === 0 && (
                        <div className="py-4 text-center text-gray-500 text-sm">
                          No suggestions available
                        </div>
                      )}
                  </div>
                </ScrollArea>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Field issues */}
        {fieldIssues.length > 0 && (
          <div className="space-y-1">
            {fieldIssues.slice(0, 2).map((issue, index) => (
              <div
                className={cn(
                  "flex items-start gap-2 text-sm",
                  issue.severity === "error" && "text-red-600",
                  issue.severity === "warning" && "text-yellow-600",
                  issue.severity === "info" && "text-blue-600"
                )}
                key={index.toString()}
              >
                {getIssueIcon(issue.severity)}
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        {description && !error && !fieldIssues.length && (
          <p className="text-gray-500 text-xs">{description}</p>
        )}

        {/* External error */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

SmartInput.displayName = "SmartInput";

// Smart Textarea component
export const SmartTextarea = forwardRef<
  HTMLTextAreaElement,
  SmartTextareaProps
>(
  (
    {
      fieldName,
      smartForm,
      showSuggestions = true,
      label,
      description,
      error,
      className,
      value = "",
      onChange,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [localValue, setLocalValue] = useState(value as string);
    const [showSmartSuggestionPanel, setShowSmartSuggestionPanel] =
      useState(false);

    // Get smart suggestions for this field
    const fieldSuggestions = smartForm.suggestions[fieldName] || [];
    const fieldIssues = smartForm.validationIssues.filter(
      (issue) => issue.field === fieldName
    );
    const isActive = smartForm.activeField === fieldName;

    const handleFocus = () => {
      smartForm.handleFieldFocus(fieldName);
      setShowSmartSuggestionPanel(true);
      onFocus?.({} as React.FocusEvent<HTMLTextAreaElement>);
    };

    const handleBlur = () => {
      smartForm.handleFieldBlur(fieldName, localValue);
      setTimeout(() => setShowSmartSuggestionPanel(false), 200);
      onBlur?.({} as React.FocusEvent<HTMLTextAreaElement>);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      onChange?.(e);
    };

    const applySuggestion = (suggestion: any) => {
      setLocalValue(suggestion.value);
      onChange?.({
        target: { value: suggestion.value },
      } as React.ChangeEvent<HTMLTextAreaElement>);
      smartForm.applySuggestion(suggestion);
      setShowSmartSuggestionPanel(false);
    };

    // Get the most severe issue for styling
    const severeIssue = fieldIssues.reduce((prev, current) => {
      if (current.severity === "error") return current;
      if (current.severity === "warning" && prev?.severity !== "error")
        return current;
      return prev;
    }, fieldIssues[0]);

    const getBorderColor = () => {
      if (severeIssue) {
        switch (severeIssue.severity) {
          case "error":
            return "border-red-500 focus:border-red-500";
          case "warning":
            return "border-yellow-500 focus:border-yellow-500";
          default:
            return "border-blue-500 focus:border-blue-500";
        }
      }
      if (isActive) {
        return "border-purple-500 focus:border-purple-500";
      }
      return "";
    };

    return (
      <div className="space-y-2">
        {label && (
          <div className="flex items-center justify-between">
            <label className="font-medium text-sm" htmlFor={fieldName}>
              {label}
            </label>
            {isActive && fieldSuggestions.length > 0 && (
              <Badge className="text-xs" variant="outline">
                <Brain className="mr-1 h-3 w-3" />
                AI suggestions
              </Badge>
            )}
          </div>
        )}

        <div className="relative">
          <Textarea
            className={cn(className, getBorderColor())}
            onBlur={handleBlur}
            onChange={handleChange}
            onFocus={handleFocus}
            ref={ref}
            value={localValue}
            {...props}
          />

          {/* AI suggestions panel for textarea */}
          {showSuggestions &&
            showSmartSuggestionPanel &&
            fieldSuggestions.length > 0 && (
              <Card className="absolute top-full right-0 left-0 z-10 mt-2 shadow-lg">
                <CardContent className="p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-sm">AI Suggestions</span>
                  </div>

                  <div className="space-y-2">
                    {fieldSuggestions.slice(0, 2).map((suggestion, index) => (
                      <Button
                        className="h-auto w-full py-2 text-left"
                        key={index.toString()}
                        onClick={() => applySuggestion(suggestion)}
                        variant="outline"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {suggestion.type} suggestion
                            </span>
                            <Badge className="text-xs" variant="secondary">
                              {Math.round(suggestion.confidence * 100)}%
                            </Badge>
                          </div>
                          <div className="text-left text-gray-600 text-xs">
                            "{suggestion.value.substring(0, 100)}
                            {suggestion.value.length > 100 ? "..." : ""}"
                          </div>
                          <div className="text-gray-500 text-xs">
                            {suggestion.reason}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>

        {/* Field issues */}
        {fieldIssues.length > 0 && (
          <div className="space-y-1">
            {fieldIssues.slice(0, 2).map((issue, index) => (
              <div
                className={cn(
                  "flex items-start gap-2 text-sm",
                  issue.severity === "error" && "text-red-600",
                  issue.severity === "warning" && "text-yellow-600",
                  issue.severity === "info" && "text-blue-600"
                )}
                key={index.toString()}
              >
                {issue.severity === "error" && (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {issue.severity === "warning" && (
                  <AlertCircle className="h-4 w-4" />
                )}
                {issue.severity === "info" && <Info className="h-4 w-4" />}
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Description */}
        {description && !error && !fieldIssues.length && (
          <p className="text-gray-500 text-xs">{description}</p>
        )}

        {/* External error */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

SmartTextarea.displayName = "SmartTextarea";

// Form completion indicator component
type FormCompletionIndicatorProps = {
  smartForm: ReturnType<typeof useSmartForm>;
};

export function FormCompletionIndicator({
  smartForm,
}: FormCompletionIndicatorProps) {
  const { formAnalysis, autoFillForm, isValidating } = smartForm;

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">Form Completion</h3>
          {isValidating && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>

        {/* Progress bars */}
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span>Completeness</span>
              <span>{Math.round(formAnalysis.completeness)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  getCompletenessColor(formAnalysis.completeness)
                )}
                style={{ width: `${formAnalysis.completeness}%` }}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span>Quality</span>
              <span>{Math.round(formAnalysis.quality)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  getCompletenessColor(formAnalysis.quality)
                )}
                style={{ width: `${formAnalysis.quality}%` }}
              />
            </div>
          </div>
        </div>

        {/* Issues summary */}
        {formAnalysis.issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-xs">
              Issues ({formAnalysis.issues.length})
            </h4>
            <div className="space-y-1">
              {formAnalysis.issues.slice(0, 3).map((issue, index) => (
                <div
                  className="flex items-center gap-2 text-xs"
                  key={index.toString()}
                >
                  {issue.severity === "error" && (
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                  )}
                  {issue.severity === "warning" && (
                    <AlertCircle className="h-3 w-3 text-yellow-500" />
                  )}
                  {issue.severity === "info" && (
                    <Info className="h-3 w-3 text-blue-500" />
                  )}
                  <span className="text-gray-600">{issue.message}</span>
                </div>
              ))}
              {formAnalysis.issues.length > 3 && (
                <div className="text-gray-500 text-xs">
                  +{formAnalysis.issues.length - 3} more issues
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auto-fill button */}
        {formAnalysis.suggestions.length > 0 && (
          <Button
            className="w-full"
            onClick={autoFillForm}
            size="sm"
            variant="outline"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Auto-fill suggestions ({formAnalysis.suggestions.length})
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
