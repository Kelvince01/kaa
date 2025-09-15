/**
 * Address interface
 */
export type IAddress = {
  line1: string;
  line2?: string;
  town: string;
  county: string;
  postalCode: string;
  country: string;
  directions?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

/**
 * Geolocation interface
 */
export type IGeoLocation = {
  type: string;
  coordinates: number[];
};
