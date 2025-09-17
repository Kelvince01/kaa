import { useCallback, useEffect, useState } from "react";
import { locationService } from "@/modules/location/location.service";
import type {
  Address,
  AddressSuggestion,
  AddressValidationResult,
  Coordinates,
} from "@/modules/location/location.type";

export type UseSmartAddressOptions = {
  initialValue?: Address;
  initialCoordinates?: Coordinates;
  validateOnChange?: boolean;
  required?: boolean;
  countryCode?: string;
};

export type UseSmartAddressReturn = {
  // State
  address: Address | null;
  coordinates: Coordinates | null;
  selectedSuggestion: AddressSuggestion | null;
  validation: AddressValidationResult | null;

  // Handlers
  handleAddressChange: (
    address: Address,
    suggestion: AddressSuggestion
  ) => void;
  handleCoordinatesChange: (coordinates: Coordinates) => void;
  clearAddress: () => void;

  // Utilities
  formatAddress: () => string;
  isValid: boolean;
  hasCoordinates: boolean;
  validationScore: number;

  // Actions
  validateAddress: () => Promise<AddressValidationResult | null>;
  reverseGeocode: (coords: Coordinates) => Promise<void>;
  getCurrentLocation: () => Promise<void>;
};

export function useSmartAddress(
  options: UseSmartAddressOptions = {}
): UseSmartAddressReturn {
  const {
    initialValue,
    initialCoordinates,
    validateOnChange = true,
    countryCode = "ke",
  } = options;

  // State
  const [address, setAddress] = useState<Address | null>(initialValue || null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(
    initialCoordinates || null
  );
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<AddressSuggestion | null>(null);
  const [validation, setValidation] = useState<AddressValidationResult | null>(
    null
  );

  // Handlers
  // biome-ignore lint/correctness/useExhaustiveDependencies: false positive
  const handleAddressChange = useCallback(
    (newAddress: Address, suggestion: AddressSuggestion) => {
      setAddress(newAddress);
      setSelectedSuggestion(suggestion);

      // Update coordinates if available
      if (suggestion.coordinates) {
        setCoordinates(suggestion.coordinates);
      }

      // Auto-validate if enabled
      if (validateOnChange) {
        validateAddress();
      }
    },
    [validateOnChange]
  );

  const handleCoordinatesChange = useCallback((newCoordinates: Coordinates) => {
    setCoordinates(newCoordinates);
  }, []);

  const clearAddress = useCallback(() => {
    setAddress(null);
    setCoordinates(null);
    setSelectedSuggestion(null);
    setValidation(null);
  }, []);

  // Utilities
  const formatAddress = useCallback((): string => {
    if (!address) {
      return "";
    }
    return locationService.formatAddress(address);
  }, [address]);

  const isValid = validation?.isValid ?? false;
  const hasCoordinates = coordinates !== null;
  const validationScore = validation?.confidence ?? 0;

  // Actions
  const validateAddress =
    useCallback(async (): Promise<AddressValidationResult | null> => {
      if (!address) {
        return null;
      }

      try {
        const result = await locationService.validateAddress(address);
        setValidation(result);
        return result;
      } catch (error) {
        console.error("Address validation error:", error);
        return null;
      }
    }, [address]);

  const reverseGeocode = useCallback(
    async (coords: Coordinates): Promise<void> => {
      try {
        const suggestion = await locationService.reverseGeocode(coords);
        if (suggestion) {
          setAddress(suggestion.address);
          setSelectedSuggestion(suggestion);
          setCoordinates(coords);

          if (validateOnChange) {
            const validationResult = await locationService.validateAddress(
              suggestion.address
            );
            setValidation(validationResult);
          }
        }
      } catch (error) {
        console.error("Reverse geocoding error:", error);
      }
    },
    [validateOnChange]
  );

  const getCurrentLocation = useCallback(async (): Promise<void> => {
    try {
      const coords = await locationService.getCurrentLocation();
      await reverseGeocode(coords);
    } catch (error) {
      console.error("Get current location error:", error);
      throw error; // Re-throw so component can handle the error
    }
  }, [reverseGeocode]);

  // Auto-validate when address changes
  useEffect(() => {
    if (address && validateOnChange && !validation) {
      validateAddress();
    }
  }, [address, validateOnChange, validation, validateAddress]);

  return {
    // State
    address,
    coordinates,
    selectedSuggestion,
    validation,

    // Handlers
    handleAddressChange,
    handleCoordinatesChange,
    clearAddress,

    // Utilities
    formatAddress,
    isValid,
    hasCoordinates,
    validationScore,

    // Actions
    validateAddress,
    reverseGeocode,
    getCurrentLocation,
  };
}

export default useSmartAddress;
