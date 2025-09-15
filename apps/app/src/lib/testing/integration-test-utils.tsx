import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
// import { createOptimizedQueryClient } from "@/lib/performance/query-optimization";

/**
 * Test utilities for React Query integration testing
 */

// Mock data generators
export const mockPropertyData = {
  id: "prop-123",
  name: "Test Property",
  address: "123 Test St",
  landlordId: "landlord-123",
  type: "residential",
  status: "active",
};

export const mockContractorData = {
  id: "contractor-123",
  name: "Test Contractor",
  company: "Test Company",
  email: "test@contractor.com",
  phone: "+1234567890",
  specialties: ["plumbing", "electrical"],
  rating: 4.5,
  availability: true,
};

export const mockInsuranceData = {
  id: "insurance-123",
  propertyId: "prop-123",
  provider: "Test Insurance Co",
  policyNumber: "POL-123456",
  type: "property",
  premium: 1200,
  deductible: 500,
  coverageAmount: 500_000,
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  status: "active",
};

export const mockScheduleData = {
  id: "schedule-123",
  propertyId: "prop-123",
  title: "Maintenance Check",
  description: "Monthly maintenance inspection",
  startDate: "2024-08-15T10:00:00Z",
  endDate: "2024-08-15T12:00:00Z",
  type: "maintenance",
  status: "scheduled",
  assignedTo: "contractor-123",
};

export const mockValuationData = {
  id: "valuation-123",
  propertyId: "prop-123",
  estimatedValue: 850_000,
  valuationDate: "2024-08-01",
  method: "automated",
  confidence: 0.85,
  marketTrends: {
    trend: "increasing",
    percentageChange: 5.2,
  },
  comparables: [],
};

/**
 * Create a test query client with optimized settings
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Wrapper component for testing with React Query
 */
type TestWrapperProps = {
  children: ReactNode;
  queryClient?: QueryClient;
};

export function TestWrapper({ children, queryClient }: TestWrapperProps) {
  const testQueryClient = queryClient || createTestQueryClient();

  return (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Custom render function with React Query provider
 */
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
}

export function renderWithQueryClient(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <TestWrapper queryClient={queryClient}>{children}</TestWrapper>
    ),
    ...renderOptions,
  });
}

/**
 * Mock API responses for testing
 */
export const mockApiResponses = {
  // Properties
  getProperties: () => Promise.resolve([mockPropertyData]),
  getProperty: () => Promise.resolve(mockPropertyData),

  // Contractors
  getContractors: () => Promise.resolve([mockContractorData]),
  getContractor: () => Promise.resolve(mockContractorData),
  getContractorsByProperty: () => Promise.resolve([mockContractorData]),

  // Insurance
  getInsurancePolicies: () => Promise.resolve([mockInsuranceData]),
  getInsurancePolicy: () => Promise.resolve(mockInsuranceData),
  getInsurancePoliciesByProperty: () => Promise.resolve([mockInsuranceData]),

  // Scheduling
  getSchedules: () => Promise.resolve([mockScheduleData]),
  getSchedule: () => Promise.resolve(mockScheduleData),
  getSchedulesByProperty: () => Promise.resolve([mockScheduleData]),

  // Valuation
  getValuations: () => Promise.resolve([mockValuationData]),
  getValuation: () => Promise.resolve(mockValuationData),
  getValuationsByProperty: () => Promise.resolve([mockValuationData]),
};

/**
 * Test scenarios for integration testing
 */
export const testScenarios = {
  // Loading states
  loading: {
    // biome-ignore lint/suspicious/noEmptyBlockStatements: false positive
    contractors: () => new Promise(() => {}), // Never resolves
    // biome-ignore lint/suspicious/noEmptyBlockStatements: false positive
    insurance: () => new Promise(() => {}),
    // biome-ignore lint/suspicious/noEmptyBlockStatements: false positive
    scheduling: () => new Promise(() => {}),
    // biome-ignore lint/suspicious/noEmptyBlockStatements: false positive
    valuation: () => new Promise(() => {}),
  },

  // Error states
  error: {
    contractors: () => Promise.reject(new Error("Failed to fetch contractors")),
    insurance: () => Promise.reject(new Error("Failed to fetch insurance")),
    scheduling: () => Promise.reject(new Error("Failed to fetch schedules")),
    valuation: () => Promise.reject(new Error("Failed to fetch valuations")),
  },

  // Empty states
  empty: {
    contractors: () => Promise.resolve([]),
    insurance: () => Promise.resolve([]),
    scheduling: () => Promise.resolve([]),
    valuation: () => Promise.resolve([]),
  },

  // Success states with data
  success: mockApiResponses,
};

/**
 * Performance testing utilities
 */

// biome-ignore lint/complexity/noStaticOnlyClass: false positive
export class PerformanceTestUtils {
  private static measurements: Map<string, number[]> = new Map();

  static startMeasurement(key: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      if (!PerformanceTestUtils.measurements.has(key)) {
        PerformanceTestUtils.measurements.set(key, []);
      }

      if (!PerformanceTestUtils.measurements.has(key)) {
        PerformanceTestUtils.measurements.set(key, []);
      }

      PerformanceTestUtils.measurements.get(key)?.push(duration);
    };
  }

  static getAverageTime(key: string): number {
    const times = PerformanceTestUtils.measurements.get(key) || [];
    if (times.length === 0) return 0;

    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  static getMedianTime(key: string): number {
    const times = PerformanceTestUtils.measurements.get(key) || [];
    if (times.length === 0) return 0;

    const sorted = [...times].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0
      ? // @ts-expect-error
        (((sorted[mid - 1] as number) + sorted[mid]) as number) / 2
      : (sorted[mid] as number);
  }

  static getPercentile(key: string, percentile: number): number {
    const times = PerformanceTestUtils.measurements.get(key) || [];
    if (times.length === 0) return 0;

    const sorted = [...times].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;

    return sorted[Math.max(0, index)] as number;
  }

  static getAllMetrics(key: string) {
    return {
      count: PerformanceTestUtils.measurements.get(key)?.length || 0,
      average: PerformanceTestUtils.getAverageTime(key),
      median: PerformanceTestUtils.getMedianTime(key),
      p95: PerformanceTestUtils.getPercentile(key, 95),
      p99: PerformanceTestUtils.getPercentile(key, 99),
    };
  }

  static reset() {
    PerformanceTestUtils.measurements.clear();
  }
}

/**
 * Integration test helpers
 */
export const integrationTestHelpers = {
  // Wait for queries to settle
  waitForQueries: async (queryClient: QueryClient) => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    return queryClient.isFetching() === 0;
  },

  // Simulate user interactions
  simulateUserFlow: {
    propertySelection: async () => {
      const endMeasurement =
        PerformanceTestUtils.startMeasurement("property-selection");

      await Promise.all([
        mockApiResponses.getProperty(),
        mockApiResponses.getContractorsByProperty(),
        mockApiResponses.getInsurancePoliciesByProperty(),
        mockApiResponses.getSchedulesByProperty(),
        mockApiResponses.getValuationsByProperty(),
      ]);

      endMeasurement();
    },

    contractorBooking: async () => {
      const endMeasurement =
        PerformanceTestUtils.startMeasurement("contractor-booking");

      await mockApiResponses.getContractor();
      await new Promise((resolve) => setTimeout(resolve, 100));

      endMeasurement();
    },

    insuranceClaim: async () => {
      const endMeasurement =
        PerformanceTestUtils.startMeasurement("insurance-claim");

      await mockApiResponses.getInsurancePolicy();
      await new Promise((resolve) => setTimeout(resolve, 150));

      endMeasurement();
    },
  },

  // Validate data consistency
  validateDataConsistency: {
    propertyData: (property: any) => {
      return (
        property &&
        typeof property.id === "string" &&
        typeof property.name === "string" &&
        typeof property.landlordId === "string"
      );
    },

    contractorData: (contractor: any) => {
      return (
        contractor &&
        typeof contractor.id === "string" &&
        typeof contractor.name === "string" &&
        Array.isArray(contractor.specialties)
      );
    },

    insuranceData: (insurance: any) => {
      return (
        insurance &&
        typeof insurance.id === "string" &&
        typeof insurance.propertyId === "string" &&
        typeof insurance.premium === "number"
      );
    },

    scheduleData: (schedule: any) => {
      return (
        schedule &&
        typeof schedule.id === "string" &&
        typeof schedule.propertyId === "string" &&
        typeof schedule.startDate === "string"
      );
    },

    valuationData: (valuation: any) => {
      return (
        valuation &&
        typeof valuation.id === "string" &&
        typeof valuation.propertyId === "string" &&
        typeof valuation.estimatedValue === "number"
      );
    },
  },
};
