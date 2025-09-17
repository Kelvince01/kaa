/**
 * Address interface for location operations
 */
export type Address = {
  line1?: string;
  line2?: string;
  town?: string;
  county?: string;
  constituency?: string;
  postalCode?: string;
  country?: string;
};

/**
 * Coordinates interface for location data
 */
export type Coordinates = {
  lat: number;
  lng: number;
};

/**
 * Address suggestion from geocoding services
 */
export type AddressSuggestion = {
  id: string;
  displayName: string;
  address: Address;
  coordinates?: Coordinates;
  confidence: number;
  category?: "administrative" | "residential" | "commercial" | "landmark";
  metadata?: {
    placeId?: string;
    osmId?: string;
    boundingBox?: [number, number, number, number];
    importance?: number;
  };
};

/**
 * Address validation result
 */
export type AddressValidationResult = {
  isValid: boolean;
  confidence: number;
  suggestions?: AddressSuggestion[];
  issues?: Array<{
    field: string;
    message: string;
    severity: "error" | "warning" | "info";
  }>;
};

/**
 * Options for place search
 */
export type PlaceSearchOptions = {
  limit?: number;
  countryCode?: string;
  includeDetails?: boolean;
};
