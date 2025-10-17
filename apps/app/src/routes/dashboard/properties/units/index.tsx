"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useProperties } from "@/modules/properties/property.queries";
import { MeterReadingModal } from "@/modules/units/components/modals/meter-reading-modal";
import { TenantAssignmentModal } from "@/modules/units/components/modals/tenant-assignment-modal";
import { VacateUnitModal } from "@/modules/units/components/modals/vacate-unit-modal";
import { UnitForm } from "@/modules/units/components/unit-form";
import type { Unit } from "@/modules/units/unit.type";
import { UnitDetails } from "./unit-details";
import { UnitsOverview } from "./units-overview";

type ViewMode = "overview" | "details" | "create" | "edit";

type UnitsContainerState = {
  mode: ViewMode;
  selectedUnit: Unit | null;
};

type ModalState = {
  tenantAssignment: boolean;
  meterReading: boolean;
  vacateUnit: boolean;
};

export function UnitsContainer() {
  const router = useRouter();
  const { data: propertiesData, isLoading: isLoadingProperties } =
    useProperties();

  const [state, setState] = useState<UnitsContainerState>({
    mode: "overview",
    selectedUnit: null,
  });

  const [modals, setModals] = useState<ModalState>({
    tenantAssignment: false,
    meterReading: false,
    vacateUnit: false,
  });

  // Get the first property as default for creating units
  const defaultPropertyId = propertiesData?.properties?.[0]?._id || "";
  const hasProperties =
    propertiesData?.properties && propertiesData.properties.length > 0;

  const handleCreateUnit = () => {
    setState({ mode: "create", selectedUnit: null });
  };

  const handleViewUnit = (unit: Unit) => {
    setState({ mode: "details", selectedUnit: unit });
  };

  const handleEditUnit = (unit: Unit) => {
    setState({ mode: "edit", selectedUnit: unit });
  };

  const handleBack = () => {
    setState({ mode: "overview", selectedUnit: null });
  };

  const handleSuccess = () => {
    setState({ mode: "overview", selectedUnit: null });
    router.refresh();
  };

  const handleAssignTenant = (unit: Unit) => {
    setState((prev) => ({ ...prev, selectedUnit: unit }));
    setModals((prev) => ({ ...prev, tenantAssignment: true }));
  };

  const handleVacateTenant = (unit: Unit) => {
    setState((prev) => ({ ...prev, selectedUnit: unit }));
    setModals((prev) => ({ ...prev, vacateUnit: true }));
  };

  const handleUpdateMeterReadings = (unit: Unit) => {
    setState((prev) => ({ ...prev, selectedUnit: unit }));
    setModals((prev) => ({ ...prev, meterReading: true }));
  };

  const handleModalClose = (modalName: keyof ModalState) => {
    setModals((prev) => ({ ...prev, [modalName]: false }));
  };

  const handleModalSuccess = (
    modalName: keyof ModalState,
    message?: string
  ) => {
    setModals((prev) => ({ ...prev, [modalName]: false }));
    if (message) {
      toast.success(message);
    }
    router.refresh();
  };

  const renderMainContent = () => {
    // Show loading state while properties are being fetched
    if (isLoadingProperties) {
      return (
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="mb-4 h-8 w-64 rounded bg-muted" />
            <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div className="h-32 rounded bg-muted" key={i.toString()} />
              ))}
            </div>
            <div className="h-96 rounded bg-muted" />
          </div>
        </div>
      );
    }

    switch (state.mode) {
      case "overview":
        return (
          <UnitsOverview
            onCreateUnit={handleCreateUnit}
            onViewUnit={handleViewUnit}
          />
        );

      case "details":
        if (!state.selectedUnit) return null;
        return (
          <UnitDetails
            onAssignTenant={handleAssignTenant}
            onBack={handleBack}
            onEdit={handleEditUnit}
            onUpdateMeterReadings={handleUpdateMeterReadings}
            onVacateTenant={handleVacateTenant}
            unit={state.selectedUnit}
          />
        );

      case "create":
        if (!hasProperties) {
          return (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={handleBack}
                  type="button"
                >
                  ← Back to Units
                </button>
              </div>
              <div className="max-w-2xl">
                <h1 className="mb-2 font-bold text-3xl tracking-tight">
                  Create New Unit
                </h1>
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-muted-foreground">
                    You need to create a property first before adding units.
                  </p>
                  <button
                    className="mt-4 text-primary hover:underline"
                    onClick={() => router.push("/dashboard/properties")}
                    type="button"
                  >
                    Go to Properties →
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={handleBack}
                type="button"
              >
                ← Back to Units
              </button>
            </div>
            <div className="max-w-2xl">
              <h1 className="mb-2 font-bold text-3xl tracking-tight">
                Create New Unit
              </h1>
              <p className="mb-6 text-muted-foreground">
                Add a new unit to your property portfolio
              </p>
              <UnitForm
                onCancel={handleBack}
                onSuccess={handleSuccess}
                propertyId={defaultPropertyId}
              />
            </div>
          </div>
        );

      case "edit":
        if (!state.selectedUnit) return null;
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={handleBack}
                type="button"
              >
                ← Back to Unit Details
              </button>
            </div>
            <div className="max-w-2xl">
              <h1 className="mb-2 font-bold text-3xl tracking-tight">
                Edit Unit
              </h1>
              <p className="mb-6 text-muted-foreground">
                Update unit information and settings
              </p>
              <UnitForm
                initialData={state.selectedUnit}
                onCancel={handleBack}
                onSuccess={handleSuccess}
                propertyId={
                  typeof state.selectedUnit.property === "string"
                    ? state.selectedUnit.property
                    : state.selectedUnit.property._id
                }
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderMainContent()}

      {/* Modals */}
      <TenantAssignmentModal
        onOpenChange={() => handleModalClose("tenantAssignment")}
        onSuccess={() =>
          handleModalSuccess(
            "tenantAssignment",
            "Tenant assigned successfully!"
          )
        }
        open={modals.tenantAssignment}
        unit={state.selectedUnit}
      />

      <MeterReadingModal
        onOpenChange={() => handleModalClose("meterReading")}
        onSuccess={() =>
          handleModalSuccess(
            "meterReading",
            "Meter readings updated successfully!"
          )
        }
        open={modals.meterReading}
        unit={state.selectedUnit}
      />

      <VacateUnitModal
        onOpenChange={() => handleModalClose("vacateUnit")}
        onSuccess={() =>
          handleModalSuccess("vacateUnit", "Unit vacated successfully!")
        }
        open={modals.vacateUnit}
        unit={state.selectedUnit}
      />
    </>
  );
}
