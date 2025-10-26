"use client";

import { Button } from "@kaa/ui/components/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { CreateMaintenanceForm } from "@/modules/maintenance/components/forms/create-maintenance-form";

export default function NewMaintenancePage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/dashboard/maintenance");
  };

  const handleCancel = () => {
    router.push("/dashboard/maintenance");
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={handleCancel} size="sm" variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Create Maintenance Request
          </h1>
          <p className="text-muted-foreground">
            Submit a new maintenance request for one of your properties
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <CreateMaintenanceForm
          onCancel={handleCancel}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
