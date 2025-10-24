"use client";

import { Badge } from "@kaa/ui/components/badge";
import { Button } from "@kaa/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@kaa/ui/components/card";
import { AlertTriangle, CheckCircle, MapPin, Navigation } from "lucide-react";
import { useState } from "react";
import useSmartAddress from "@/hooks/use-smart-address";
import SmartAddressInput from "../common/form-fields/smart-address-input";

export function SmartAddressExample() {
  const [showDetails, setShowDetails] = useState(true);

  const {
    address,
    coordinates,
    selectedSuggestion,
    validation,
    handleAddressChange,
    handleCoordinatesChange,
    clearAddress,
    formatAddress,
    isValid,
    hasCoordinates,
    validationScore,
    getCurrentLocation,
  } = useSmartAddress({
    validateOnChange: true,
    countryCode: "ke",
  });

  const handleGetCurrentLocation = async () => {
    try {
      await getCurrentLocation();
    } catch (error) {
      console.error("Failed to get current location:", error);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Smart Address Input Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SmartAddressInput
            className="w-full"
            countryCode="ke"
            onChange={handleAddressChange}
            onCoordinatesChange={handleCoordinatesChange}
            placeholder="Search for an address in Kenya..."
            showCurrentLocation={true}
            showValidation={true}
            value={address || undefined}
          />

          <div className="flex gap-2">
            <Button
              onClick={handleGetCurrentLocation}
              size="sm"
              variant="outline"
            >
              <Navigation className="mr-2 h-4 w-4" />
              Get Current Location
            </Button>
            <Button
              disabled={!address}
              onClick={clearAddress}
              size="sm"
              variant="outline"
            >
              Clear Address
            </Button>
            <Button
              onClick={() => setShowDetails(!showDetails)}
              size="sm"
              variant="outline"
            >
              {showDetails ? "Hide" : "Show"} Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {showDetails && address && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Address Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status indicators */}
            <div className="flex gap-2">
              <Badge variant={isValid ? "default" : "secondary"}>
                {isValid ? (
                  <>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Valid
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Needs Validation
                  </>
                )}
              </Badge>

              {hasCoordinates && (
                <Badge variant="outline">
                  <MapPin className="mr-1 h-3 w-3" />
                  Has Coordinates
                </Badge>
              )}

              {validation && (
                <Badge variant="outline">
                  {Math.round(validationScore * 100)}% Confidence
                </Badge>
              )}
            </div>

            {/* Formatted address */}
            <div>
              <h4 className="mb-2 font-medium">Formatted Address:</h4>
              <p className="rounded-md bg-muted p-3 text-sm">
                {formatAddress()}
              </p>
            </div>

            {/* Address components */}
            <div>
              <h4 className="mb-2 font-medium">Address Components:</h4>
              <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                {address.line1 && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Line 1:
                    </span>
                    <p>{address.line1}</p>
                  </div>
                )}
                {address.line2 && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Line 2:
                    </span>
                    <p>{address.line2}</p>
                  </div>
                )}
                {address.town && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Town/City:
                    </span>
                    <p>{address.town}</p>
                  </div>
                )}
                {address.county && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      County:
                    </span>
                    <p>{address.county}</p>
                  </div>
                )}
                {address.constituency && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Constituency:
                    </span>
                    <p>{address.constituency}</p>
                  </div>
                )}
                {address.postalCode && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Postal Code:
                    </span>
                    <p>{address.postalCode}</p>
                  </div>
                )}
                {address.country && (
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Country:
                    </span>
                    <p>{address.country}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Coordinates */}
            {coordinates && (
              <div>
                <h4 className="mb-2 font-medium">Coordinates:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Latitude:
                    </span>
                    <p className="font-mono">{coordinates.lat.toFixed(6)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Longitude:
                    </span>
                    <p className="font-mono">{coordinates.lng.toFixed(6)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Selected suggestion details */}
            {selectedSuggestion && (
              <div>
                <h4 className="mb-2 font-medium">Suggestion Details:</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Provider:
                    </span>
                    <p className="capitalize">
                      {selectedSuggestion.id.split("-")[0]}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Confidence:
                    </span>
                    <p>{Math.round(selectedSuggestion.confidence * 100)}%</p>
                  </div>
                  {selectedSuggestion.category && (
                    <div>
                      <span className="font-medium text-muted-foreground">
                        Category:
                      </span>
                      <p className="capitalize">
                        {selectedSuggestion.category}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Validation details */}
            {validation?.issues && validation.issues.length > 0 && (
              <div>
                <h4 className="mb-2 font-medium">Validation Issues:</h4>
                <div className="space-y-2">
                  {validation.issues.map((issue: any, index: number) => (
                    <div
                      className="flex items-start gap-2 text-sm"
                      key={index.toString()}
                    >
                      <AlertTriangle
                        className={`mt-0.5 h-4 w-4 ${
                          issue.severity === "error"
                            ? "text-red-500"
                            : issue.severity === "warning"
                              ? "text-yellow-500"
                              : "text-blue-500"
                        }`}
                      />
                      <div>
                        <span className="font-medium">{issue.field}:</span>
                        <span className="ml-1">{issue.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw data for debugging */}
            <details className="mt-6">
              <summary className="cursor-pointer font-medium text-muted-foreground text-sm">
                Raw Data (Debug)
              </summary>
              <div className="mt-2 space-y-2">
                <div>
                  <h5 className="font-medium text-xs">Address Object:</h5>
                  <pre className="overflow-auto rounded bg-muted p-2 text-xs">
                    {JSON.stringify(address, null, 2)}
                  </pre>
                </div>
                {coordinates && (
                  <div>
                    <h5 className="font-medium text-xs">Coordinates:</h5>
                    <pre className="overflow-auto rounded bg-muted p-2 text-xs">
                      {JSON.stringify(coordinates, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedSuggestion && (
                  <div>
                    <h5 className="font-medium text-xs">
                      Selected Suggestion:
                    </h5>
                    <pre className="overflow-auto rounded bg-muted p-2 text-xs">
                      {JSON.stringify(selectedSuggestion, null, 2)}
                    </pre>
                  </div>
                )}
                {validation && (
                  <div>
                    <h5 className="font-medium text-xs">Validation Result:</h5>
                    <pre className="overflow-auto rounded bg-muted p-2 text-xs">
                      {JSON.stringify(validation, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SmartAddressExample;
