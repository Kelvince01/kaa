// Export insurance types

// Export insurance queries
export * from "./insurance.queries";

// Export insurance services
export * from "./insurance.service";
// Re-export commonly used types for convenience
export type {
  CreateInsuranceClaimInput,
  CreateInsurancePolicyInput,
  InsuranceClaim,
  InsuranceClaimListResponse,
  InsuranceClaimResponse,
  InsurancePolicy,
  InsurancePolicyListResponse,
  InsurancePolicyResponse,
  UpdateInsuranceClaimInput,
  UpdateInsurancePolicyInput,
} from "./insurance.type";
export * from "./insurance.type";
