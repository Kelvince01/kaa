"use client";

import { Toaster } from "@kaa/ui/components/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropertyWizard } from "./property-wizard";

// Create QueryClient for data management
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
    },
    mutations: {
      retry: 1,
    },
  },
});

type PropertyFormV4Props = {
  onComplete?: (property: any) => void;
  onCancel?: () => void;
};

/**
 * Property Creation Form V4
 *
 * Combines the best features from components/create and components/new:
 * - Enhanced stepper with validation from create
 * - Clean, modern UI from new-v2/v3
 * - Strictly follows CreatePropertyData schema
 * - Mobile and tablet responsive design
 * - Real-time validation and feedback
 * - Progress tracking and step navigation
 *
 * Features:
 * ✅ Step-by-step wizard with 9 steps
 * ✅ Real-time validation
 * ✅ Progress tracking
 * ✅ Mobile-responsive design
 * ✅ Accessible UI with keyboard navigation
 * ✅ Smart form logic (market analysis, quality scoring)
 * ✅ Image management
 * ✅ Location with GPS support
 * ✅ Comprehensive property details
 */
export function PropertyFormV4({ onComplete, onCancel }: PropertyFormV4Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <PropertyWizard onCancel={onCancel} onComplete={onComplete} />

        {/* Global notifications */}
        <Toaster
          closeButton
          position="bottom-right"
          richColors
          toastOptions={{
            duration: 4000,
          }}
        />
      </div>
    </QueryClientProvider>
  );
}

export default PropertyFormV4;

// Export individual components and utilities for flexibility
export { PropertyWizard } from "./property-wizard";
export * from "./schema";
export * from "./steps";

/**
 * Usage Example:
 *
 * ```tsx
 * import { PropertyFormV4 } from '@/modules/properties/components/new-v4';
 *
 * export default function NewPropertyPage() {
 *   const router = useRouter();
 *
 *   return (
 *     <PropertyFormV4
 *       onComplete={(property) => {
 *         console.log('Property created:', property);
 *         router.push(`/properties/${property.id}`);
 *       }}
 *       onCancel={() => router.push('/properties')}
 *     />
 *   );
 * }
 * ```
 */
