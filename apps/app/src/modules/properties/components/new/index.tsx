import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@kaa/ui/components/card";
import { cn } from "@kaa/ui/lib/utils";
import { useEffect, useState } from "react";
import { Step, Stepper } from "@/components/common/stepper";
import useMounted from "@/hooks/use-mounted";
import { BasicInfoForm } from "@/modules/properties/components/new/basic-info";
import { DetailsInfoForm } from "@/modules/properties/components/new/details-info";
import { LocationInfoForm } from "@/modules/properties/components/new/location-info";
import { PricingInfoForm } from "@/modules/properties/components/new/pricing-info";
import type { Property } from "@/modules/properties/property.type";
import { AIPropertyAssistantModal } from "../ai-property-assistant-modal";
import { AvailabilityInfoForm } from "./availability-info";
import { onDefaultPropertySteps } from "./config";
import { FeaturesInfoForm } from "./features-info";
import StepperFooter from "./footer";
import { MediaInfoForm } from "./media-info";
import { ReviewInfo } from "./review-info";

export type NewPropertyStates = "stepper" | "completed";

type NewPropertyProps = {
  newProperty: NewPropertyStates;
  newPropertyToStepper: () => void;
};

const NewProperty = ({ newProperty = "stepper" }: NewPropertyProps) => {
  const { hasStarted } = useMounted();

  const [steps, setSteps] = useState(onDefaultPropertySteps);
  const [property, setProperty] = useState<Property | null>(null);

  const animateClass = `transition-all will-change-transform duration-500 ease-out ${hasStarted ? "opacity-100" : "opacity-0 scale-95 translate-y-4"}`;

  useEffect(() => {
    // setSteps([onDefaultPropertySteps[0] as StepItem]);
  }, []);

  const onCreateProperty = (property: Property) => {
    setProperty(property);
  };

  console.log(steps);

  return (
    <div className="flex min-h-[90vh] flex-col items-center sm:min-h-screen">
      <div className="mt-auto mb-auto w-full">
        {newProperty === "stepper" && (
          <div
            className={cn(
              "mx-4 mt-0 flex flex-col justify-center gap-4 px-4 py-4 sm:w-10/12",
              animateClass
            )}
          >
            <AIPropertyAssistantModal />
            <Stepper initialStep={0} orientation="horizontal" steps={steps}>
              {steps.map(({ description, label, id }) => (
                <Step key={label} label={label}>
                  <Card>
                    <CardHeader>
                      <CardDescription className="font-light">
                        {description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {id === "basic" && (
                        <BasicInfoForm property={property as Property}>
                          <StepperFooter />
                        </BasicInfoForm>
                      )}
                      {id === "details" && (
                        <DetailsInfoForm property={property as Property}>
                          <StepperFooter />
                        </DetailsInfoForm>
                      )}
                      {id === "location" && (
                        <LocationInfoForm property={property as Property}>
                          <StepperFooter />
                        </LocationInfoForm>
                      )}
                      {/* {id === "pricing" && property && ( */}
                      {id === "pricing" && (
                        <PricingInfoForm property={property as Property}>
                          {/* <StepperFooter property={property} /> */}
                          <StepperFooter />
                        </PricingInfoForm>
                      )}
                      {id === "features" && (
                        <FeaturesInfoForm property={property as Property}>
                          <StepperFooter />
                        </FeaturesInfoForm>
                      )}
                      {id === "media" && (
                        <MediaInfoForm property={property as Property}>
                          <StepperFooter />
                        </MediaInfoForm>
                      )}

                      {id === "availability" && (
                        <AvailabilityInfoForm property={property as Property}>
                          <StepperFooter />
                        </AvailabilityInfoForm>
                      )}
                      {id === "review" && (
                        <ReviewInfo
                          callback={onCreateProperty}
                          property={property as Property}
                        >
                          <StepperFooter property={property} />
                        </ReviewInfo>
                      )}
                    </CardContent>
                  </Card>
                </Step>
              ))}
            </Stepper>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewProperty;
