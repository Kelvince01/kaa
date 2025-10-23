import {
  Collapsible,
  CollapsibleContent,
} from "@kaa/ui/components/collapsible";
import { cn } from "@kaa/ui/lib/utils";
import { cva } from "class-variance-authority";
import * as React from "react";
import { StepButtonContainer } from "./step-button-container";
import { StepIcon } from "./step-icon";
import { StepLabel } from "./step-label";
import type { StepSharedProps } from "./types";
import { useStepper } from "./use-stepper";

type VerticalStepProps = StepSharedProps & {
  children?: React.ReactNode;
};

const verticalStepVariants = cva(
  [
    "relative flex flex-col transition-all duration-200",
    "data-[completed=true]:not-last:after:bg-primary",
    "data-[invalid=true]:not-last:after:bg-destructive",
  ],
  {
    variants: {
      variant: {
        circle: cn(
          "not-last:gap-(--step-gap) not-last:pb-(--step-gap)",
          "not-last:after:w-0.5 not-last:after:bg-border not-last:after:content-['']",
          "not-last:after:inset-x-[calc(var(--step-icon-size)/2)]",
          "not-last:after:absolute",
          "not-last:after:top-[calc(var(--step-icon-size)+var(--step-gap))]",
          "not-last:after:bottom-(--step-gap)",
          "not-last:after:transition-all not-last:after:duration-200"
        ),
        line: "mb-4 flex-1 border-t-0",
      },
    },
  }
);

const VerticalStep = React.forwardRef<HTMLDivElement, VerticalStepProps>(
  (props, ref) => {
    const {
      children,
      index,
      isCompletedStep,
      isCurrentStep,
      label,
      description,
      icon,
      hasVisited,
      state,
      checkIcon: checkIconProp,
      errorIcon: errorIconProp,
      onClickStep,
    } = props;

    const {
      checkIcon: checkIconContext,
      errorIcon: errorIconContext,
      isError,
      isLoading,
      variant,
      onClickStep: onClickStepGeneral,
      clickable,
      expandVerticalSteps,
      styles,
      scrollTracking,
      orientation,
      steps,
      setStep,
      isLastStep: isLastStepCurrentStep,
      previousActiveStep,
    } = useStepper();

    const opacity = hasVisited ? 1 : 0.8;
    const localIsLoading = isLoading || state === "loading";
    const localIsError = isError || state === "error";

    const isLastStep = index === steps.length - 1;

    const active =
      variant === "line" ? isCompletedStep || isCurrentStep : isCompletedStep;
    const checkIcon = checkIconProp || checkIconContext;
    const errorIcon = errorIconProp || errorIconContext;

    const renderChildren = () => {
      if (!expandVerticalSteps) {
        return (
          <Collapsible open={isCurrentStep}>
            <CollapsibleContent
              className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
              ref={(node) => {
                if (
                  // If the step is the first step and the previous step
                  // was the last step or if the step is not the first step
                  // This prevents initial scrolling when the stepper
                  // is located anywhere other than the top of the view.
                  scrollTracking &&
                  ((index === 0 &&
                    previousActiveStep &&
                    previousActiveStep === steps.length) ||
                    (index && index > 0))
                ) {
                  node?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                }
              }}
            >
              {children}
            </CollapsibleContent>
          </Collapsible>
        );
      }
      return children;
    };

    return (
      <div
        className={cn(
          "stepper__vertical-step",
          verticalStepVariants({
            variant: variant?.includes("circle") ? "circle" : "line",
          }),
          isLastStepCurrentStep && "gap-var(--step-gap)",
          styles?.["vertical-step"]
        )}
        data-active={active}
        data-clickable={clickable || !!onClickStep}
        data-completed={isCompletedStep}
        data-invalid={localIsError}
        data-optional={steps[index || 0]?.optional}
        onClick={() =>
          onClickStep?.(index || 0, setStep) ||
          onClickStepGeneral?.(index || 0, setStep)
        }
        ref={ref}
      >
        <div
          className={cn(
            "stepper__vertical-step-container",
            "flex items-center",
            variant === "line" &&
              "border-s-[.19rem] py-2 ps-3 data-[active=true]:border-primary",
            styles?.["vertical-step-container"]
          )}
          data-active={active}
          data-vertical={true}
        >
          <StepButtonContainer
            {...{ isLoading: localIsLoading, isError: localIsError, ...props }}
          >
            <StepIcon
              {...{
                index,
                isError: localIsError,
                isLoading: localIsLoading,
                isCurrentStep,
                isCompletedStep,
              }}
              checkIcon={checkIcon}
              errorIcon={errorIcon}
              icon={icon}
            />
          </StepButtonContainer>
          <StepLabel
            description={description}
            label={label}
            {...{ isCurrentStep, opacity }}
          />
        </div>
        <div
          className={cn(
            "stepper__vertical-step-content",
            !isLastStep && "min-h-4",
            variant !== "line" &&
              "max-sm:relative max-sm:z-1 sm:ps-(--step-icon-size)",
            variant === "line" && orientation === "vertical" && "min-h-0",
            styles?.["vertical-step-content"]
          )}
        >
          {renderChildren()}
        </div>
      </div>
    );
  }
);

export { VerticalStep };
