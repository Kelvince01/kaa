"use client";

import { PropertyFormV4 } from "@/modules/properties/components/new-v4";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * New Property V4 Page
 * 
 * Enhanced property listing form with:
 * - 9-step wizard with validation
 * - Mobile-responsive design
 * - Quality scoring and market analysis
 * - GPS location support
 * - Real-time validation
 * 
 * Route: /dashboard/properties/new-v4
 */
export default function NewPropertyV4Page() {
  const router = useRouter();

  const handleComplete = (property: any) => {
    // Track successful property creation
    console.log("Property created successfully:", property);

    // Show success notification
    toast.success("Property Listed Successfully!", {
      description: `${property.title} is now under review`,
      duration: 5000,
      action: {
        label: "View",
        onClick: () => router.push(`/dashboard/properties/${property.id}`),
      },
    });

    // Navigate to properties list
    router.push("/dashboard/properties");
  };

  const handleCancel = () => {
    const confirmed = confirm(
      "Are you sure you want to cancel? All progress will be lost."
    );

    if (confirmed) {
      router.push("/dashboard/properties");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PropertyFormV4 onCancel={handleCancel} onComplete={handleComplete} />
    </div>
  );
}
