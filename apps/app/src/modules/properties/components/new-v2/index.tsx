"use client";

import { PropertyForm } from "./property-form";

export function PropertyFormV2() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 md:py-10">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">
            List Your Property
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Complete the form below to list your property. Your progress is
            saved automatically.
          </p>
        </div>

        {/* Form */}
        <PropertyForm />
      </div>
    </div>
  );
}

export { PropertyForm } from "./property-form";
export * from "./schema";
export * from "./steps";
