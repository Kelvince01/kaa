import { Button } from "@kaa/ui/components/button";
import { cn } from "@kaa/ui/lib/utils";
import type { StepSharedProps } from "./types";
import { useStepper } from "./use-stepper";

type StepButtonContainerProps = StepSharedProps & {
  children?: React.ReactNode;
};

const StepButtonContainer = ({
  isCurrentStep,
  isCompletedStep,
  children,
  isError,
  isLoading: isLoadingProp,
  onClickStep,
}: StepButtonContainerProps) => {
  const {
    clickable,
    isLoading: isLoadingContext,
    variant,
    styles,
  } = useStepper();

  const currentStepClickable = clickable || !!onClickStep;

  const isLoading = isLoadingProp || isLoadingContext;

  if (variant === "line") {
    return null;
  }

  return (
    <Button
      aria-current={isCurrentStep ? "step" : undefined}
      className={cn(
        "stepper__step-button-container",
        "pointer-events-none rounded-full p-0",
        "h-(--step-icon-size) w-(--step-icon-size)",
        "flex items-center justify-center rounded-full border-2",
        "data-[clickable=true]:pointer-events-auto",
        "data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
        "data-[current=true]:border-primary data-[current=true]:bg-secondary",
        "data-[invalid=true]:border-destructive data-[invalid=true]:bg-destructive data-[invalid=true]:text-destructive-foreground",
        styles?.["step-button-container"]
      )}
      data-active={isCompletedStep}
      data-clickable={currentStepClickable}
      data-current={isCurrentStep}
      data-invalid={isError && (isCurrentStep || isCompletedStep)}
      data-loading={isLoading && (isCurrentStep || isCompletedStep)}
      tabIndex={currentStepClickable ? 0 : -1}
      type="button"
      variant="ghost"
    >
      {children}
    </Button>
  );
};

export { StepButtonContainer };
