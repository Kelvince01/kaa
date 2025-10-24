import type React from "react";
import { useState } from "react";
import {
  useCreateInsuranceClaim,
  useExpiredPolicies,
  useInsuranceClaims,
  useInsurancePolicies,
} from "@/modules/properties/insurance";

type PropertyInsurancePanelProps = {
  propertyId: string;
  landlordId: string;
};

export const PropertyInsurancePanel: React.FC<PropertyInsurancePanelProps> = ({
  propertyId,
  landlordId,
}) => {
  const [activeTab, setActiveTab] = useState<"policies" | "claims" | "expired">(
    "policies"
  );
  const [showClaimForm, setShowClaimForm] = useState(false);

  const {
    data: policiesData,
    isLoading: loadingPolicies,
    error: policiesError,
  } = useInsurancePolicies({ property: propertyId });

  const {
    data: claimsData,
    isLoading: loadingClaims,
    error: claimsError,
  } = useInsuranceClaims({ property: propertyId });

  const { data: expiredData, isLoading: loadingExpired } = useExpiredPolicies();

  const { mutate: createClaim, isPending: creatingClaim } =
    useCreateInsuranceClaim();

  const handleCreateClaim = (claimData: any) => {
    createClaim(
      {
        ...claimData,
        property: propertyId,
        landlord: landlordId,
      },
      {
        onSuccess: () => {
          setShowClaimForm(false);
        },
      }
    );
  };

  const tabs = [
    {
      id: "policies",
      name: "Active Policies",
      count: policiesData?.data?.policies?.length || 0,
    },
    {
      id: "claims",
      name: "Claims",
      count: claimsData?.data?.claims?.length || 0,
    },
    {
      id: "expired",
      name: "Expired",
      count: expiredData?.data?.policies?.length || 0,
    },
  ];

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-medium text-gray-900 text-lg leading-6">
            Insurance Management
          </h3>
          <button
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => setShowClaimForm(true)}
            type="button"
          >
            File New Claim
          </button>
        </div>

        {/* Tabs */}
        <div className="border-gray-200 border-b">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                className={`border-b-2 px-1 py-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                type="button"
              >
                {tab.name}
                {tab.count > 0 && (
                  <span
                    className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === "policies" && (
            <div className="space-y-4">
              {loadingPolicies ? (
                <div className="animate-pulse space-y-4">
                  {[...new Array(3)].map((_, i) => (
                    <div className="rounded-lg border p-4" key={i.toString()}>
                      <div className="mb-2 h-4 w-1/4 rounded bg-gray-200" />
                      <div className="mb-2 h-3 w-1/2 rounded bg-gray-200" />
                      <div className="h-3 w-1/3 rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
              ) : policiesError ? (
                <div className="text-red-600 text-sm">
                  Error loading policies
                </div>
              ) : (
                <div className="space-y-4">
                  {policiesData?.data?.policies?.map((policy) => (
                    <div
                      className="rounded-lg border p-4 transition-shadow hover:shadow-md"
                      key={policy._id}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {policy.provider}
                          </h4>
                          <p className="text-gray-600 text-sm capitalize">
                            {policy.insuranceType}
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Coverage:</span>
                              <span className="ml-1 font-medium">
                                $
                                {policy.coverage?.buildingValue?.toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Premium:</span>
                              <span className="ml-1 font-medium">
                                $
                                {policy.premium?.annualPremium?.toLocaleString()}
                                /year
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${
                              policy.status === "active"
                                ? "bg-green-100 text-green-800"
                                : policy.status === "expired"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {policy.status}
                          </span>
                          <p className="mt-1 text-gray-500 text-xs">
                            Expires:{" "}
                            {new Date(
                              policy.terms?.endDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "claims" && (
            <div className="space-y-4">
              {loadingClaims ? (
                <div className="animate-pulse space-y-4">
                  {[...new Array(2)].map((_, i) => (
                    <div className="rounded-lg border p-4" key={i.toString()}>
                      <div className="mb-2 h-4 w-1/3 rounded bg-gray-200" />
                      <div className="mb-2 h-3 w-1/2 rounded bg-gray-200" />
                      <div className="h-3 w-2/3 rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
              ) : claimsError ? (
                <div className="text-red-600 text-sm">Error loading claims</div>
              ) : (
                <div className="space-y-4">
                  {claimsData?.data?.claims?.map((claim) => (
                    <div
                      className="rounded-lg border p-4 transition-shadow hover:shadow-md"
                      key={claim._id}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            Claim #{claim.claimNumber}
                          </h4>
                          <p className="text-gray-600 text-sm capitalize">
                            {claim.claimType}
                          </p>
                          <p className="mt-1 text-gray-500 text-sm">
                            {claim.description}
                          </p>
                          <div className="mt-2 text-sm">
                            <span className="text-gray-500">
                              Claimed Amount:
                            </span>
                            <span className="ml-1 font-medium">
                              ${claim.claimedAmount?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${
                              claim.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : claim.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : claim.status === "under_review"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {claim.status}
                          </span>
                          <p className="mt-1 text-gray-500 text-xs">
                            Filed:{" "}
                            {new Date(claim.incidentDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "expired" && (
            <div className="space-y-4">
              {loadingExpired ? (
                <div className="animate-pulse space-y-4">
                  {[...new Array(2)].map((_, i) => (
                    <div className="rounded-lg border p-4" key={i.toString()}>
                      <div className="mb-2 h-4 w-1/4 rounded bg-gray-200" />
                      <div className="h-3 w-1/2 rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {expiredData?.data?.policies?.map((policy) => (
                    <div
                      className="rounded-lg border border-red-200 bg-red-50 p-4"
                      key={policy._id}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {policy.provider}
                          </h4>
                          <p className="text-gray-600 text-sm capitalize">
                            {policy.insuranceType}
                          </p>
                          <p className="mt-1 text-red-600 text-sm">
                            Expired:{" "}
                            {new Date(
                              policy.terms?.endDate
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          className="inline-flex items-center rounded border border-transparent bg-red-600 px-3 py-1.5 font-medium text-white text-xs hover:bg-red-700"
                          type="button"
                        >
                          Renew Policy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Claim Form Modal */}
      {showClaimForm && (
        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
            <div className="mt-3">
              <h3 className="mb-4 font-medium text-gray-900 text-lg">
                File New Claim
              </h3>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleCreateClaim({
                    claimType: formData.get("claimType"),
                    description: formData.get("description"),
                    claimedAmount: Number(formData.get("claimedAmount")),
                    incidentDate: formData.get("incidentDate"),
                  });
                }}
              >
                <div>
                  <label
                    className="block font-medium text-gray-700 text-sm"
                    htmlFor="claimType"
                  >
                    Claim Type
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    name="claimType"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="fire">Fire</option>
                    <option value="flood">Flood</option>
                    <option value="theft">Theft</option>
                    <option value="vandalism">Vandalism</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label
                    className="block font-medium text-gray-700 text-sm"
                    htmlFor="description"
                  >
                    Description
                  </label>
                  <textarea
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    name="description"
                    required
                    rows={3}
                  />
                </div>
                <div>
                  <label
                    className="block font-medium text-gray-700 text-sm"
                    htmlFor="claimedAmount"
                  >
                    Claimed Amount
                  </label>
                  <input
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    min="0"
                    name="claimedAmount"
                    required
                    step="0.01"
                    type="number"
                  />
                </div>
                <div>
                  <label
                    className="block font-medium text-gray-700 text-sm"
                    htmlFor="incidentDate"
                  >
                    Incident Date
                  </label>
                  <input
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    name="incidentDate"
                    required
                    type="date"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50"
                    onClick={() => setShowClaimForm(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    disabled={creatingClaim}
                    type="submit"
                  >
                    {creatingClaim ? "Filing..." : "File Claim"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
