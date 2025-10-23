"use client";

import { config } from "@kaa/config";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { NewPropertyStates } from "@/modules/properties/components/new";
import NewProperty from "@/modules/properties/components/new";
import { NewPropertyCompleted } from "@/modules/properties/components/new/completed";
import { useNewPropertyStore } from "@/modules/properties/property.store";
import { isElementInteractive } from "@/shared/utils/is-el-interactive";

export default function NewPropertyPage() {
  const router = useRouter();
  const { finishedCreating } = useNewPropertyStore();
  const [newProperty, setNewProperty] = useState<NewPropertyStates>(
    finishedCreating ? "completed" : "stepper"
  );

  const onOpenChange = () => {
    router.replace(config.defaultRedirectPath);
  };

  // Close onboarding on escape key if not focused on form
  const onEscapeKeyDown = (e: KeyboardEvent) => {
    e.preventDefault();

    const activeElement = document.activeElement;
    if (isElementInteractive(activeElement)) return;
    setNewProperty("completed");
  };

  useEffect(() => {
    if (finishedCreating) setNewProperty("completed");
  }, [finishedCreating]);

  return (
    <>
      <NewProperty
        newProperty={newProperty}
        newPropertyToStepper={() => setNewProperty("stepper")}
      />

      {newProperty === "completed" && <NewPropertyCompleted />}
    </>
  );
}
