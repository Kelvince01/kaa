"use client";

import { Alert, AlertDescription } from "@kaa/ui/components/alert";
import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { Skeleton } from "@kaa/ui/components/skeleton";
import { AlertCircle, Phone, Star } from "lucide-react";
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
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton className="h-48 w-full" key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>Error loading contractors: {error.message}</span>
            <Button onClick={() => refetch()} size="sm" variant="outline">
              Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  const contractors = contractorsData?.data?.contractors || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl tracking-tight">
            Available Contractors
          </h2>
          <p className="text-muted-foreground">
            {contractors.length} contractor{contractors.length !== 1 ? "s" : ""}{" "}
            found
          </p>
        </div>
      </div>

      {contractors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 rounded-full bg-muted p-3">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 font-semibold text-lg">No contractors found</h3>
            <p className="text-center text-muted-foreground text-sm">
              Try adjusting your search criteria or service area.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contractors.map((contractor) => (
            <Card className="flex flex-col" key={contractor._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{contractor.name}</CardTitle>
                    {contractor.company && (
                      <CardDescription>{contractor.company}</CardDescription>
                    )}
                  </div>
                  {contractor.emergencyAvailable && (
                    <Badge className="ml-2" variant="destructive">
                      Emergency
                    </Badge>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex items-center">
                    {[...new Array(5)].map((_, i) => (
                      <Star
                        className={`h-4 w-4 ${
                          i < Math.floor(contractor.averageRating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-muted text-muted-foreground"
                        }`}
                        key={`star-${contractor._id}-${i}`}
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground text-sm">
                    ({contractor.averageRating?.toFixed(1) || "No rating"})
                  </span>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                {/* Specialties */}
                <div className="flex flex-wrap gap-2">
                  {contractor.specialties?.slice(0, 3).map((specialty) => (
                    <Badge key={specialty} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                  {contractor.specialties &&
                    contractor.specialties.length > 3 && (
                      <Badge variant="outline">
                        +{contractor.specialties.length - 3} more
                      </Badge>
                    )}
                </div>

                {/* Pricing */}
                {contractor.hourlyRate && (
                  <div className="text-sm">
                    <span className="font-semibold">
                      ${contractor.hourlyRate}
                    </span>
                    <span className="text-muted-foreground">/hour</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    disabled={checkingAvailability}
                    onClick={() => handleCheckAvailability(contractor._id)}
                    size="sm"
                    variant="outline"
                  >
                    {checkingAvailability
                      ? "Checking..."
                      : "Check Availability"}
                  </Button>
                  <Button className="flex-1" size="sm">
                    <Phone className="mr-2 h-4 w-4" />
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
