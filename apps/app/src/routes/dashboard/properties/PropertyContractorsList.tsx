import type React from "react";
import {
  useContractorAvailability,
  useContractors,
} from "@/modules/properties/contractors";
import { ContractorSpecialty } from "@/modules/properties/contractors/contractor.type";

type PropertyContractorsListProps = {
  propertyId: string;
  specialty?: ContractorSpecialty;
  serviceArea?: string;
};

export const PropertyContractorsList: React.FC<
  PropertyContractorsListProps
> = ({ specialty, serviceArea }) => {
  const {
    data: contractorsData,
    isLoading,
    error,
    refetch,
  } = useContractors({
    specialty,
    serviceArea,
    sortBy: "averageRating",
    sortOrder: "desc",
  });

  const {
    data: availabilityData,
    isPending: checkingAvailability,
    mutate: checkAvailability,
  } = useContractorAvailability();

  const handleCheckAvailability = (_contractorId: string) => {
    checkAvailability({
      specialty: specialty || ContractorSpecialty.GENERAL_MAINTENANCE,
      serviceArea: serviceArea || "default",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "17:00",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-blue-600 border-b-2" />
        <span className="ml-2">Loading contractors...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex">
          <div className="shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                clipRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                fillRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="font-medium text-red-800 text-sm">
              Error loading contractors
            </h3>
            <p className="mt-1 text-red-700 text-sm">{error.message}</p>
            <button
              className="mt-2 text-red-800 text-sm underline hover:text-red-900"
              onClick={() => refetch()}
              type="button"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const contractors = contractorsData?.data?.contractors || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 text-lg">
          Available Contractors
        </h2>
        <span className="text-gray-500 text-sm">
          {contractors.length} contractor{contractors.length !== 1 ? "s" : ""}{" "}
          found
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contractors.map((contractor) => (
          <div
            className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
            key={contractor._id}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{contractor.name}</h3>
                {contractor.company && (
                  <p className="text-gray-600 text-sm">{contractor.company}</p>
                )}
                <div className="mt-2 flex items-center">
                  <div className="flex items-center">
                    {[...new Array(5)].map((_, i) => (
                      <svg
                        className={`h-4 w-4 ${
                          i < Math.floor(contractor.averageRating || 0)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                        fill="currentColor"
                        key={i.toString()}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-1 text-gray-600 text-sm">
                      ({contractor.averageRating?.toFixed(1) || "No rating"})
                    </span>
                  </div>
                </div>
              </div>
              {contractor.emergencyAvailable && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 font-medium text-red-800 text-xs">
                  Emergency
                </span>
              )}
            </div>

            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {contractor.specialties?.slice(0, 3).map((specialty) => (
                  <span
                    className="inline-flex items-center rounded bg-blue-100 px-2 py-1 font-medium text-blue-800 text-xs"
                    key={specialty}
                  >
                    {specialty}
                  </span>
                ))}
                {contractor.specialties &&
                  contractor.specialties.length > 3 && (
                    <span className="inline-flex items-center rounded bg-gray-100 px-2 py-1 font-medium text-gray-800 text-xs">
                      +{contractor.specialties.length - 3} more
                    </span>
                  )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-gray-600 text-sm">
                {contractor.hourlyRate && (
                  <span>${contractor.hourlyRate}/hr</span>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  className="inline-flex items-center rounded border border-gray-300 bg-white px-3 py-1.5 font-medium text-gray-700 text-xs shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  disabled={checkingAvailability}
                  onClick={() => handleCheckAvailability(contractor._id)}
                  type="button"
                >
                  {checkingAvailability ? "Checking..." : "Check Availability"}
                </button>
                <button
                  className="inline-flex items-center rounded border border-transparent bg-blue-600 px-3 py-1.5 font-medium text-white text-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  type="button"
                >
                  Contact
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {contractors.length === 0 && (
        <div className="py-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
          <h3 className="mt-2 font-medium text-gray-900 text-sm">
            No contractors found
          </h3>
          <p className="mt-1 text-gray-500 text-sm">
            Try adjusting your search criteria or service area.
          </p>
        </div>
      )}
    </div>
  );
};
