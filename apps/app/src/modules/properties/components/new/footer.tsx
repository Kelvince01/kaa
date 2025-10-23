import { Button } from "@kaa/ui/components/button";
import { ArrowLeft, Redo } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useStepper } from "@/components/common/stepper";
import { useNewPropertyStore } from "@/modules/properties/property.store";
import type { Property } from "@/modules/properties/property.type";

const StepperFooter = ({ property }: { property?: Property | null }) => {
  const {
    nextStep,
    prevStep,
    isOptionalStep,
    hasCompletedAllSteps,
    activeStep,
  } = useStepper();
  const t = useTranslations();
  const { setFinishedCreating } = useNewPropertyStore();
  // Ask to confirm
  const skipStep = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    nextStep();
  };

  // prevent accidental submit
  const backStep = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    prevStep();
  };

  useEffect(() => {
    if ((activeStep === 2 && property === null) || hasCompletedAllSteps) {
      setFinishedCreating();
    }
  }, [property, hasCompletedAllSteps, activeStep, setFinishedCreating]);

  return (
    <div className="flex w-full justify-end gap-2 max-sm:justify-stretch">
      {activeStep >= 1 && !property && (
        <Button
          className="max-sm:w-full"
          onClick={backStep}
          variant="secondary"
        >
          <ArrowLeft className="mr-2" size={16} />
          {t("common.previous")}
        </Button>
      )}
      {isOptionalStep && (
        <Button
          className="max-sm:w-full"
          onClick={skipStep}
          variant="secondary"
        >
          <Redo className="mr-2" size={16} />
          {t("common.skip")}
        </Button>
      )}
    </div>
  );
};

export default StepperFooter;
