import { BedDouble, Check, DollarSign, House, MapPin } from "lucide-react";
import type { StepItem } from "@/components/common/stepper/types";
import { useDraftStore } from "@/shared/stores/draft.store";
import { useNewPropertyStore } from "../../property.store";

export const onDefaultPropertySteps: StepItem[] = [
  {
    id: "basic",
    // label: t("properties.new.general"),
    label: "Basic Information",
    // description: t("properties.new.general", { name: useUserStore.getState().user.name }),
    description: "Property title, type, and description",
    icon: House,
  },
  {
    id: "details",
    // label: t("properties.new.details"),
    label: "Details",
    // description: t("properties.new.details"),
    description: "Bedrooms, bathrooms, and features",
    icon: BedDouble,
  },
  {
    id: "location",
    // label: t("properties.new.location"),
    label: "Location",
    // description: t("properties.new.location"),
    description: "Address and location details",
    icon: MapPin,
  },
  {
    id: "pricing",
    // label: t("properties.new.pricing"),
    label: "Pricing",
    // description: t("properties.new.pricing"),
    description: "Rent amount and payment terms",
    icon: DollarSign,
  },
  {
    id: "features",
    label: "Features",
    description: "Property features and amenities",
    optional: true,
    icon: Check,
  },
  {
    id: "media",
    label: "Media",
    description: "Photos and virtual tours",
  },
  {
    id: "availability",
    label: "Availability",
    description: "Availability and additional info",
  },
  {
    id: "review",
    label: "Review",
    description: "Review and submit your listing",
  },
];

export const onPropertyFinishCallback = () => {
  // Clear all draft forms
  useDraftStore.setState({ forms: {} });
  // Set the finished onboarding state to true
  useNewPropertyStore.getState().setNewPropertyOpen(false);
  useNewPropertyStore.getState().setFinishedCreating();
};
