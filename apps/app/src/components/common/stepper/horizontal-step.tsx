import { cn } from "@kaa/ui/lib/utils";
import * as React from "react";
import { StepButtonContainer } from "./step-button-container";
import { StepIcon } from "./step-icon";
import { StepLabel } from "./step-label";
import type { StepSharedProps } from "./types";
import { useStepper } from "./use-stepper";

const HorizontalStep = React.forwardRef<HTMLDivElement, StepSharedProps>(
  (props, ref) => {
    const {
      isError,
      isLoading,
      onClickStep,
      variant,
      clickable,
      checkIcon: checkIconContext,
      errorIcon: errorIconContext,
      styles,
      steps,
      setStep,
    } = useStepper();

    const {
      index,
      isCompletedStep,
      isCurrentStep,
      hasVisited,
      icon,
      label,
      description,
      isKeepError,
      state,
      checkIcon: checkIconProp,
      errorIcon: errorIconProp,
    } = props;

    const localIsLoading = isLoading || state === "loading";
    const localIsError = isError || state === "error";

    const opacity = hasVisited ? 1 : 0.8;

    const active =
      variant === "line" ? isCompletedStep || isCurrentStep : isCompletedStep;

    const checkIcon = checkIconProp || checkIconContext;
    const errorIcon = errorIconProp || errorIconContext;

    return (
      <div
        aria-disabled={!hasVisited}
        className={cn(
          "stepper__horizontal-step",
          "relative flex items-center transition-all duration-200",
          "not-last:flex-1",
          "not-last:after:transition-all not-last:after:duration-200",
          "not-last:after:h-0.5 not-last:after:bg-border not-last:after:content-['']",
          "data-[completed=true]:not-last:after:bg-primary",
          "data-[invalid=true]:not-last:after:bg-destructive",
          variant === "circle-alt" &&
            "not-last:after:-order-1 flex-1 flex-col justify-start not-last:after:relative not-last:after:start-[50%] not-last:after:end-[50%] not-last:after:top-[calc(var(--step-icon-size)/2)] not-last:after:w-[calc((100%-var(--step-icon-size))-(var(--step-gap)))]",
          variant === "circle" &&
            "not-last:after:ms-(--step-gap) not-last:after:me-(--step-gap) not-last:after:flex-1",
          variant === "line" &&
            "flex-1 flex-col border-t-[.19rem] data-[active=true]:border-primary",
          styles?.["horizontal-step"]
        )}
        data-active={active}
        data-clickable={clickable}
        data-completed={isCompletedStep}
        data-invalid={localIsError}
        data-optional={steps[index || 0]?.optional}
        onClick={() => onClickStep?.(index || 0, setStep)}
        ref={ref}
      >
        <div
          className={cn(
            "stepper__horizontal-step-container",
            "flex items-center",
            variant === "circle-alt" && "flex-col justify-center gap-1",
            variant === "line" && "w-full",
            styles?.["horizontal-step-container"]
          )}
        >
          <StepButtonContainer
            {...{ ...props, isError: localIsError, isLoading: localIsLoading }}
          >
            <StepIcon
              {...{
                index,
                isCompletedStep,
                isCurrentStep,
                isError: localIsError,
                isKeepError,
                isLoading: localIsLoading,
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
      </div>
    );
  }
);

export { HorizontalStep };
