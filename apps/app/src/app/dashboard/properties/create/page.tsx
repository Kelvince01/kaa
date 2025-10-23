"use client";

import { useRouter } from "next/navigation";
import { EnhancedNewProperty } from "@/modules/properties/components/create";

export default function CreatePropertyPage() {
  const router = useRouter();

  return (
    <EnhancedNewProperty
      onCancel={() => router.push("/properties")}
      onComplete={(property) => {
        console.log("Property created:", property);
        router.push(`/properties/${property.id}`);
      }}
    />
  );
}
