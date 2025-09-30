// Export locations helper functions
export const locationsHelpers = {
  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance: (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  },

  /**
   * Validate Kenya coordinates
   */
  isValidKenyaCoordinates: (latitude: number, longitude: number) => {
    // Kenya's approximate bounding box
    return (
      latitude >= -4.8 &&
      latitude <= 5.5 &&
      longitude >= 33.8 &&
      longitude <= 42.0
    );
  },

  /**
   * Format Kenya address
   */
  formatKenyaAddress: (components: any) => {
    const parts: string[] = [];
    if (components.building) parts.push(components.building);
    if (components.street) parts.push(components.street);
    if (components.area) parts.push(components.area);
    if (components.city) parts.push(components.city);
    if (components.county) parts.push(components.county);
    parts.push("Kenya");
    return parts.join(", ");
  },

  /**
   * Get Kenya county from coordinates
   */
  getKenyaCountyFromCoordinates: (_latitude: number, _longitude: number) => {
    // This would typically use a geospatial lookup
    // For now, return a placeholder
    return "Unknown County";
  },

  /**
   * Validate Kenya postal code
   */
  isValidKenyaPostalCode: (code: string) => {
    // biome-ignore lint/performance/useTopLevelRegex: false positive
    return /^\d{5}$/.test(code);
  },
};
