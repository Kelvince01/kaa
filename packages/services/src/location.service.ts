import crypto from "node:crypto";
import {
  GeocodingCache,
  Location,
  LocationEvent,
  LocationStatistics,
} from "@kaa/models";
import {
  GeocodingProvider,
  type ICreateLocationRequest,
  type IGeocodingResponse,
  type IGeocodingResult,
  type ILocationAnalytics,
  type ILocationEvent,
  type ILocationListResponse,
  type ILocationResponse,
  type ILocationSearchItem,
  type ILocationSearchQuery,
  type ILocationSearchResult,
  type ILocationStatistics,
  type IUpdateLocationRequest,
  KenyanCounty,
  LOCATION_CONFIG,
  LocationErrorCode,
  LocationEventType,
  LocationSortField,
  LocationStatus,
  LocationType,
} from "@kaa/models/types";
import axios from "axios";
import { Types } from "mongoose";
import NodeCache from "node-cache";

export class LocationService {
  readonly cache: NodeCache;
  private readonly geocodingApiKeys: Record<GeocodingProvider, string>;
  private readonly geocodingUsage: Map<
    string,
    { today: number; month: number; lastReset: Date }
  >;

  constructor() {
    this.cache = new NodeCache({ stdTTL: LOCATION_CONFIG.GEOCODING_CACHE_TTL });
    this.geocodingApiKeys = {
      [GeocodingProvider.GOOGLE_MAPS]: process.env.GOOGLE_MAPS_API_KEY || "",
      [GeocodingProvider.MAPBOX]: process.env.MAPBOX_API_KEY || "",
      [GeocodingProvider.HERE_MAPS]: process.env.HERE_MAPS_API_KEY || "",
      [GeocodingProvider.OPENSTREETMAP]: "",
    };
    this.geocodingUsage = new Map();

    // Initialize background tasks
    this.initializeBackgroundTasks();
  }

  // === LOCATION CRUD OPERATIONS ===

  async createLocation(
    data: ICreateLocationRequest
  ): Promise<ILocationResponse> {
    try {
      // Check for duplicate location
      const existing = await Location.findOne({
        name: data.name,
        county: data.county,
        type: data.type,
      });

      if (existing) {
        return {
          success: false,
          error: {
            code: LocationErrorCode.DUPLICATE_LOCATION,
            message: "A location with this name already exists in this county",
            timestamp: new Date(),
          },
        };
      }

      // Generate coordinates if not provided
      let coordinates = data.coordinates;
      if (!coordinates && data.address) {
        const geocodingResult = await this.geocodeAddress(
          data.address.formatted || ""
        );
        if (geocodingResult.success && geocodingResult.results.length > 0) {
          coordinates = geocodingResult.results[0]?.coordinates;
        }
      }

      if (!coordinates) {
        return {
          success: false,
          error: {
            code: LocationErrorCode.INVALID_COORDINATES,
            message: "Location coordinates are required or geocoding failed",
            timestamp: new Date(),
          },
        };
      }

      // Create location document
      const location = new Location({
        name: data.name,
        type: data.type,
        county: data.county,
        parent: data.parent ? new Types.ObjectId(data.parent) : undefined,
        coordinates,
        address: {
          ...data.address,
          county: data.county,
          country: LOCATION_CONFIG.DEFAULT_COUNTRY,
          formatted: data.address?.formatted || data.name,
        },
        metadata: {
          timeZone: LOCATION_CONFIG.DEFAULT_TIMEZONE,
          languages: LOCATION_CONFIG.SUPPORTED_LANGUAGES,
          currency: LOCATION_CONFIG.DEFAULT_CURRENCY,
          dialCode: LOCATION_CONFIG.DEFAULT_DIAL_CODE,
          alternativeNames: [],
          historicalNames: [],
          tags: data.tags || [],
          images: [],
          documents: [],
          ...data.metadata,
        },
        amenities: data.amenities || [],
        transportation: {},
        safety: {},
        visibility: {
          isPublic: true,
          searchable: true,
          featured: false,
        },
        analytics: {
          views: { total: 0, unique: 0, lastMonth: 0, trending: false },
          searches: { total: 0, keywords: [], sources: {} },
          properties: { total: 0, active: 0, averagePrice: 0, categories: {} },
          users: { registered: 0, active: 0, demographics: {} },
          bookings: { total: 0, successful: 0, cancelled: 0, revenue: 0 },
          popularity: { score: 0, rank: 0, trending: false },
          lastUpdated: new Date(),
        },
        seo: {
          title: data.name,
          description: data.description,
          keywords: data.tags || [],
        },
        status: LocationStatus.ACTIVE,
      });

      const savedLocation = await location.save();

      // Update parent's children if applicable
      if (data.parent) {
        await Location.findByIdAndUpdate(data.parent, {
          $addToSet: { children: savedLocation._id },
        });
      }

      // Log event
      await this.logLocationEvent({
        type: LocationEventType.LOCATION_CREATED,
        locationId: savedLocation._id.toString(),
        data: { name: savedLocation.name, type: savedLocation.type },
        timestamp: new Date(),
        source: "api",
      });

      // Update statistics
      await this.updateLocationStatistics();

      return {
        success: true,
        data: savedLocation.toObject(),
        message: "Location created successfully",
      };
    } catch (error) {
      console.error("Error creating location:", error);
      return {
        success: false,
        error: {
          code: LocationErrorCode.SEARCH_FAILED,
          message: "Failed to create location",
          details: { error: (error as Error).message },
          timestamp: new Date(),
        },
      };
    }
  }

  async updateLocation(
    id: string,
    data: IUpdateLocationRequest
  ): Promise<ILocationResponse> {
    try {
      const location = await Location.findById(id);
      if (!location) {
        return {
          success: false,
          error: {
            code: LocationErrorCode.LOCATION_NOT_FOUND,
            message: "Location not found",
            timestamp: new Date(),
          },
        };
      }

      // Update coordinates if address changed
      if (data.address?.formatted) {
        const geocodingResult = await this.geocodeAddress(
          data.address.formatted
        );
        if (geocodingResult.success && geocodingResult.results.length > 0) {
          data.coordinates = geocodingResult.results[0]?.coordinates;
        }
      }

      // Update location
      Object.assign(location, data);
      const updatedLocation = await location.save();

      // Log event
      await this.logLocationEvent({
        type: LocationEventType.LOCATION_UPDATED,
        locationId: id,
        data: { changes: Object.keys(data) },
        timestamp: new Date(),
        source: "api",
      });

      return {
        success: true,
        data: updatedLocation.toObject(),
        message: "Location updated successfully",
      };
    } catch (error) {
      console.error("Error updating location:", error);
      return {
        success: false,
        error: {
          code: LocationErrorCode.SEARCH_FAILED,
          message: "Failed to update location",
          details: { error: (error as Error).message },
          timestamp: new Date(),
        },
      };
    }
  }

  async getLocation(id: string, userId?: string): Promise<ILocationResponse> {
    try {
      const location = await Location.findById(id)
        .populate("parent", "name type")
        .populate("children", "name type");

      if (!location) {
        return {
          success: false,
          error: {
            code: LocationErrorCode.LOCATION_NOT_FOUND,
            message: "Location not found",
            timestamp: new Date(),
          },
        };
      }

      // Track view
      if (userId) {
        await location.addView(userId);
      }

      // Log event
      await this.logLocationEvent({
        type: LocationEventType.LOCATION_VIEWED,
        locationId: id,
        userId,
        data: {},
        timestamp: new Date(),
        source: "api",
      });

      return {
        success: true,
        data: location.toObject(),
      };
    } catch (error) {
      console.error("Error getting location:", error);
      return {
        success: false,
        error: {
          code: LocationErrorCode.SEARCH_FAILED,
          message: "Failed to get location",
          details: { error: (error as Error).message },
          timestamp: new Date(),
        },
      };
    }
  }

  async deleteLocation(id: string): Promise<ILocationResponse> {
    try {
      const location = await Location.findById(id);
      if (!location) {
        return {
          success: false,
          error: {
            code: LocationErrorCode.LOCATION_NOT_FOUND,
            message: "Location not found",
            timestamp: new Date(),
          },
        };
      }

      // Update parent's children
      if (location.parent) {
        await Location.findByIdAndUpdate(location.parent, {
          $pull: { children: location._id },
        });
      }

      // Update children's parent
      await Location.updateMany(
        { parent: location._id },
        { $unset: { parent: 1 } }
      );

      // Delete location
      await Location.findByIdAndDelete(id);

      // Log event
      await this.logLocationEvent({
        type: LocationEventType.LOCATION_DELETED,
        locationId: id,
        data: { name: location.name, type: location.type },
        timestamp: new Date(),
        source: "api",
      });

      // Update statistics
      await this.updateLocationStatistics();

      return {
        success: true,
        message: "Location deleted successfully",
      };
    } catch (error) {
      console.error("Error deleting location:", error);
      return {
        success: false,
        error: {
          code: LocationErrorCode.SEARCH_FAILED,
          message: "Failed to delete location",
          details: { error: (error as Error).message },
          timestamp: new Date(),
        },
      };
    }
  }

  // === LOCATION SEARCH ===

  async searchLocations(
    query: ILocationSearchQuery
  ): Promise<ILocationSearchResult> {
    try {
      const {
        query: searchQuery,
        county,
        type,
        coordinates,
        amenities,
        priceRange,
        features,
        sortBy = LocationSortField.POPULARITY,
        sortOrder = "desc",
        limit = 20,
        skip = 0,
      } = query;

      // Build MongoDB query
      const mongoQuery: any = {
        "visibility.isPublic": true,
        "visibility.searchable": true,
        status: LocationStatus.ACTIVE,
      };

      // Text search
      if (searchQuery) {
        mongoQuery.$text = { $search: searchQuery };
      }

      // County filter
      if (county) {
        mongoQuery.county = county;
      }

      // Type filter
      if (type) {
        mongoQuery.type = type;
      }

      // Geospatial search
      if (coordinates) {
        const radiusInMeters =
          (coordinates.radius || LOCATION_CONFIG.SEARCH_RADIUS_KM) * 1000;
        mongoQuery.coordinates = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [coordinates.longitude, coordinates.latitude],
            },
            $maxDistance: radiusInMeters,
          },
        };
      }

      // Price range filter
      if (priceRange) {
        if (priceRange.min !== undefined) {
          mongoQuery["economy.rentRange.min"] = { $gte: priceRange.min };
        }
        if (priceRange.max !== undefined) {
          mongoQuery["economy.rentRange.max"] = { $lte: priceRange.max };
        }
      }

      // Amenities filter
      if (amenities && amenities.length > 0) {
        mongoQuery["amenities.category"] = { $in: amenities };
      }

      // Features filter (tags)
      if (features && features.length > 0) {
        mongoQuery["metadata.tags"] = { $in: features };
      }

      // Execute search
      const sortObj: any = {};
      if (sortBy === LocationSortField.DISTANCE && coordinates) {
        // Distance sorting handled by $near
      } else {
        sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;
      }

      const locations = await Location.find(mongoQuery)
        .sort(sortObj)
        .skip(skip)
        .limit(Math.min(limit, 100))
        .select(
          "name type county coordinates address analytics amenities metadata.images"
        )
        .lean();

      const total = await Location.countDocuments(mongoQuery);

      // Calculate distances if coordinates provided
      const searchItems: ILocationSearchItem[] = locations.map(
        (location: any) => {
          let distance: number | undefined;
          if (coordinates) {
            distance = this.calculateDistance(
              coordinates.latitude,
              coordinates.longitude,
              location.coordinates.latitude,
              location.coordinates.longitude
            );
          }

          return {
            _id: location._id.toString(),
            name: location.name,
            type: location.type,
            county: location.county,
            coordinates: location.coordinates,
            address: { formatted: location.address.formatted },
            analytics: {
              properties: location.analytics.properties,
              popularity: location.analytics.popularity,
            },
            amenities: {
              count: location.amenities?.length || 0,
              categories: [
                ...new Set(
                  location.amenities?.map((a: any) => a.category) || []
                ),
              ] as any,
            },
            images: {
              primary: location.metadata.images?.find(
                (img: any) => img.type === "primary"
              )?.url,
            },
            distance,
            relevanceScore: searchQuery ? Math.random() * 100 : undefined, // Placeholder for actual relevance scoring
          };
        }
      );

      // Generate aggregations
      const aggregations = await this.generateLocationAggregations(mongoQuery);
      const facets = await this.generateLocationFacets();

      // Log search event
      await this.logLocationEvent({
        type: LocationEventType.LOCATION_SEARCHED,
        data: {
          query: searchQuery,
          filters: { county, type, amenities, features },
          resultsCount: searchItems.length,
        },
        timestamp: new Date(),
        source: "api",
      });

      return {
        locations: searchItems,
        total,
        aggregations,
        facets,
      };
    } catch (error) {
      console.error("Error searching locations:", error);
      throw error;
    }
  }

  // === GEOCODING SERVICES ===

  async geocodeAddress(
    address: string,
    provider?: GeocodingProvider
  ): Promise<IGeocodingResponse> {
    try {
      const selectedProvider = provider || GeocodingProvider.GOOGLE_MAPS;

      // Check cache first
      const cacheKey = this.generateGeocodingCacheKey(
        address,
        selectedProvider
      );
      const cachedResult = await this.getGeocodingCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // Check usage limits
      const usage = await this.checkGeocodingUsage(selectedProvider);
      if (usage.today >= 1000) {
        // Daily limit
        return {
          success: false,
          provider: selectedProvider,
          results: [],
          usage: {
            requestsToday: usage.today + 1,
            requestsThisMonth: usage.month + 1,
            limit: 1000,
          },
        };
      }

      let result: IGeocodingResult | null = null;

      switch (selectedProvider) {
        case GeocodingProvider.GOOGLE_MAPS:
          result = await this.geocodeWithGoogle(address);
          break;
        case GeocodingProvider.MAPBOX:
          result = await this.geocodeWithMapbox(address);
          break;
        case GeocodingProvider.OPENSTREETMAP:
          result = await this.geocodeWithOSM(address);
          break;
        default:
          result = await this.geocodeWithGoogle(address);
          break;
      }

      const response: IGeocodingResponse = {
        success: !!result,
        provider: selectedProvider,
        results: result ? [result] : [],
        usage: {
          requestsToday: usage.today + 1,
          requestsThisMonth: usage.month + 1,
          limit: 1000,
        },
      };

      // Update usage
      await this.updateGeocodingUsage(selectedProvider);

      // Cache result
      if (result) {
        await this.cacheGeocodingResult(cacheKey, response);
      }

      // Log event
      await this.logLocationEvent({
        type: LocationEventType.GEOCODING_PERFORMED,
        data: {
          address,
          provider: selectedProvider,
          success: !!result,
        },
        timestamp: new Date(),
        source: "geocoding",
      });

      return response;
    } catch (error) {
      console.error("Error geocoding address:", error);
      return {
        success: false,
        provider: provider || GeocodingProvider.GOOGLE_MAPS,
        results: [],
        usage: {
          requestsToday: 0,
          requestsThisMonth: 0,
          limit: 1000,
        },
      };
    }
  }

  async reverseGeocode(
    latitude: number,
    longitude: number,
    provider?: GeocodingProvider
  ): Promise<IGeocodingResponse> {
    try {
      const selectedProvider = provider || GeocodingProvider.GOOGLE_MAPS;

      // Check cache first
      const cacheKey = this.generateGeocodingCacheKey(
        `${latitude},${longitude}`,
        selectedProvider
      );
      const cachedResult = await this.getGeocodingCache(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // Check usage limits
      const usage = await this.checkGeocodingUsage(selectedProvider);
      if (usage.today >= 1000) {
        return {
          success: false,
          provider: selectedProvider,
          results: [],
          usage: {
            requestsToday: usage.today + 1,
            requestsThisMonth: usage.month + 1,
            limit: 1000,
          },
        };
      }

      let result: IGeocodingResult | null = null;

      switch (selectedProvider) {
        case GeocodingProvider.GOOGLE_MAPS:
          result = await this.reverseGeocodeWithGoogle(latitude, longitude);
          break;
        case GeocodingProvider.MAPBOX:
          result = await this.reverseGeocodeWithMapbox(latitude, longitude);
          break;
        case GeocodingProvider.OPENSTREETMAP:
          result = await this.reverseGeocodeWithOSM(latitude, longitude);
          break;
        default:
          result = await this.reverseGeocodeWithGoogle(latitude, longitude);
          break;
      }

      const response: IGeocodingResponse = {
        success: !!result,
        provider: selectedProvider,
        results: result ? [result] : [],
        usage: {
          requestsToday: usage.today + 1,
          requestsThisMonth: usage.month + 1,
          limit: 1000,
        },
      };

      // Update usage
      await this.updateGeocodingUsage(selectedProvider);

      // Cache result
      if (result) {
        await this.cacheGeocodingResult(cacheKey, response);
      }

      return response;
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      return {
        success: false,
        provider: provider || GeocodingProvider.GOOGLE_MAPS,
        results: [],
        usage: {
          requestsToday: 0,
          requestsThisMonth: 0,
          limit: 1000,
        },
      };
    }
  }

  // === ANALYTICS AND STATISTICS ===

  async getLocationAnalytics(locationId: string): Promise<ILocationAnalytics> {
    const location = await Location.findById(locationId);
    return (
      location?.analytics || {
        views: { total: 0, unique: 0, lastMonth: 0, trending: false },
        searches: { total: 0, keywords: [], sources: {} },
        properties: { total: 0, active: 0, averagePrice: 0, categories: {} },
        users: { registered: 0, active: 0, demographics: {} },
        bookings: { total: 0, successful: 0, cancelled: 0, revenue: 0 },
        popularity: { score: 0, rank: 0, trending: false },
        lastUpdated: new Date(),
      }
    );
  }

  async updateLocationStatistics(): Promise<void> {
    try {
      const stats = await this.calculateLocationStatistics();
      await LocationStatistics.findOneAndUpdate({}, stats, {
        upsert: true,
        new: true,
      });
    } catch (error) {
      console.error("Error updating location statistics:", error);
    }
  }

  async getLocationStatistics(): Promise<ILocationStatistics> {
    const stats = await LocationStatistics.findOne();
    return (
      stats || {
        totalLocations: 0,
        locationsByType: {
          [LocationType.COUNTY]: 0,
          [LocationType.CITY]: 0,
          [LocationType.TOWN]: 0,
          [LocationType.SUBURB]: 0,
          [LocationType.ESTATE]: 0,
          [LocationType.BUILDING]: 0,
          [LocationType.LANDMARK]: 0,
          [LocationType.NEIGHBORHOOD]: 0,
        },
        locationsByCounty: {
          [KenyanCounty.BARINGO]: 0,
          [KenyanCounty.BOMET]: 0,
          [KenyanCounty.BUNGOMA]: 0,
          [KenyanCounty.BUSIA]: 0,
          [KenyanCounty.ELGEYO_MARAKWET]: 0,
          [KenyanCounty.EMBU]: 0,
          [KenyanCounty.GARISSA]: 0,
          [KenyanCounty.HOMA_BAY]: 0,
          [KenyanCounty.ISIOLO]: 0,
          [KenyanCounty.KAJIADO]: 0,
          [KenyanCounty.KAKAMEGA]: 0,
          [KenyanCounty.KERICHO]: 0,
          [KenyanCounty.KIAMBU]: 0,
          [KenyanCounty.KILIFI]: 0,
          [KenyanCounty.KIRINYAGA]: 0,
          [KenyanCounty.KISII]: 0,
          [KenyanCounty.KISUMU]: 0,
          [KenyanCounty.KITUI]: 0,
          [KenyanCounty.KWALE]: 0,
          [KenyanCounty.LAIKIPIA]: 0,
          [KenyanCounty.LAMU]: 0,
          [KenyanCounty.MACHAKOS]: 0,
          [KenyanCounty.MAKUENI]: 0,
          [KenyanCounty.MANDERA]: 0,
          [KenyanCounty.MARSABIT]: 0,
          [KenyanCounty.MERU]: 0,
          [KenyanCounty.MIGORI]: 0,
          [KenyanCounty.MOMBASA]: 0,
          [KenyanCounty.MURANG_A]: 0,
          [KenyanCounty.NAIROBI]: 0,
          [KenyanCounty.NAKURU]: 0,
          [KenyanCounty.NANDI]: 0,
          [KenyanCounty.NAROK]: 0,
          [KenyanCounty.NYAMIRA]: 0,
          [KenyanCounty.NYANDARUA]: 0,
          [KenyanCounty.NYERI]: 0,
          [KenyanCounty.SAMBURU]: 0,
          [KenyanCounty.SIAYA]: 0,
          [KenyanCounty.TAITA_TAVETA]: 0,
          [KenyanCounty.TANA_RIVER]: 0,
          [KenyanCounty.THARAKA_NITHI]: 0,
          [KenyanCounty.TRANS_NZOIA]: 0,
          [KenyanCounty.TURKANA]: 0,
          [KenyanCounty.UASIN_GISHU]: 0,
          [KenyanCounty.VIHIGA]: 0,
          [KenyanCounty.WAJIR]: 0,
          [KenyanCounty.WEST_POKOT]: 0,
        },
        geocodingUsage: {
          total: 0,
          byProvider: {
            [GeocodingProvider.GOOGLE_MAPS]: 0,
            [GeocodingProvider.MAPBOX]: 0,
            [GeocodingProvider.OPENSTREETMAP]: 0,
            [GeocodingProvider.HERE_MAPS]: 0,
          },
          today: 0,
          thisMonth: 0,
        },
        searchMetrics: {
          totalSearches: 0,
          topKeywords: [],
          popularLocations: [],
        },
        dataQuality: {
          withCoordinates: 0,
          withBoundaries: 0,
          withAmenities: 0,
          withImages: 0,
          verified: 0,
        },
        lastUpdated: new Date(),
      }
    );
  }

  // === UTILITY METHODS ===

  async getLocationsByCounty(
    county: KenyanCounty
  ): Promise<ILocationListResponse> {
    try {
      const locations = await Location.find({
        county,
        status: LocationStatus.ACTIVE,
        "visibility.isPublic": true,
      }).sort({ name: 1 });

      return {
        success: true,
        data: {
          locations: locations.map((l) => l.toObject()),
          total: locations.length,
          page: 1,
          limit: locations.length,
          hasMore: false,
        },
      };
    } catch (error) {
      console.error("Error getting locations by county:", error);
      return {
        success: false,
        error: {
          code: LocationErrorCode.SEARCH_FAILED,
          message: "Failed to get locations by county",
          details: { error: (error as Error).message },
          timestamp: new Date(),
        },
      };
    }
  }

  async getNearbyLocations(
    latitude: number,
    longitude: number,
    radiusKm: number = LOCATION_CONFIG.SEARCH_RADIUS_KM,
    limit = 20
  ): Promise<ILocationSearchResult> {
    return await this.searchLocations({
      coordinates: { latitude, longitude, radius: radiusKm },
      limit,
      sortBy: LocationSortField.DISTANCE,
    });
  }

  async getPopularLocations(limit = 10): Promise<ILocationSearchResult> {
    return await this.searchLocations({
      sortBy: LocationSortField.POPULARITY,
      sortOrder: "desc",
      limit,
    });
  }

  // === PRIVATE HELPER METHODS ===

  private async geocodeWithGoogle(
    address: string
  ): Promise<IGeocodingResult | null> {
    try {
      const apiKey = this.geocodingApiKeys[GeocodingProvider.GOOGLE_MAPS];
      if (!apiKey) return null;

      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        {
          params: {
            address: `${address}, Kenya`,
            key: apiKey,
            region: "ke",
          },
        }
      );

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          address: {
            formatted: result.formatted_address,
            components: this.parseGoogleAddressComponents(
              result.address_components
            ),
          },
          coordinates: {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
            accuracy: this.getGoogleAccuracy(result.geometry.location_type),
          },
          type: result.types[0] || "unknown",
          confidence: this.calculateGoogleConfidence(result),
          viewport: result.geometry.viewport,
          placeId: result.place_id,
        };
      }

      return null;
    } catch (error) {
      console.error("Error geocoding with Google:", error);
      return null;
    }
  }

  private async geocodeWithMapbox(
    address: string
  ): Promise<IGeocodingResult | null> {
    try {
      const apiKey = this.geocodingApiKeys[GeocodingProvider.MAPBOX];
      if (!apiKey) return null;

      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
        {
          params: {
            access_token: apiKey,
            country: "ke",
            limit: 1,
          },
        }
      );

      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        return {
          address: {
            formatted: feature.place_name,
            components: this.parseMapboxAddressComponents(feature),
          },
          coordinates: {
            latitude: feature.center[1],
            longitude: feature.center[0],
            accuracy: feature.properties?.accuracy || 0,
          },
          type: feature.place_type[0] || "unknown",
          confidence: feature.relevance * 100,
          placeId: feature.id,
        };
      }

      return null;
    } catch (error) {
      console.error("Error geocoding with Mapbox:", error);
      return null;
    }
  }

  private async geocodeWithOSM(
    address: string
  ): Promise<IGeocodingResult | null> {
    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: `${address}, Kenya`,
            format: "json",
            addressdetails: 1,
            countrycodes: "ke",
            limit: 1,
          },
          headers: {
            "User-Agent": "Kaa Rental Platform",
          },
        }
      );

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          address: {
            formatted: result.display_name,
            components: this.parseOSMAddressComponents(result.address || {}),
          },
          coordinates: {
            latitude: Number.parseFloat(result.lat),
            longitude: Number.parseFloat(result.lon),
            accuracy: this.getOSMAccuracy(result.type),
          },
          type: result.type || "unknown",
          confidence: Number.parseFloat(result.importance || "0") * 100,
        };
      }

      return null;
    } catch (error) {
      console.error("Error geocoding with OSM:", error);
      return null;
    }
  }

  private async reverseGeocodeWithGoogle(
    latitude: number,
    longitude: number
  ): Promise<IGeocodingResult | null> {
    try {
      const apiKey = this.geocodingApiKeys[GeocodingProvider.GOOGLE_MAPS];
      if (!apiKey) return null;

      const response = await axios.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        {
          params: {
            latlng: `${latitude},${longitude}`,
            key: apiKey,
          },
        }
      );

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0];
        return {
          address: {
            formatted: result.formatted_address,
            components: this.parseGoogleAddressComponents(
              result.address_components
            ),
          },
          coordinates: {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
            accuracy: this.getGoogleAccuracy(result.geometry.location_type),
          },
          type: result.types[0] || "unknown",
          confidence: this.calculateGoogleConfidence(result),
          viewport: result.geometry.viewport,
          placeId: result.place_id,
        };
      }

      return null;
    } catch (error) {
      console.error("Error reverse geocoding with Google:", error);
      return null;
    }
  }

  private async reverseGeocodeWithMapbox(
    latitude: number,
    longitude: number
  ): Promise<IGeocodingResult | null> {
    try {
      const apiKey = this.geocodingApiKeys[GeocodingProvider.MAPBOX];
      if (!apiKey) return null;

      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`,
        {
          params: {
            access_token: apiKey,
            limit: 1,
          },
        }
      );

      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        return {
          address: {
            formatted: feature.place_name,
            components: this.parseMapboxAddressComponents(feature),
          },
          coordinates: {
            latitude: feature.center[1],
            longitude: feature.center[0],
            accuracy: feature.properties?.accuracy || 0,
          },
          type: feature.place_type[0] || "unknown",
          confidence: feature.relevance * 100,
          placeId: feature.id,
        };
      }

      return null;
    } catch (error) {
      console.error("Error reverse geocoding with Mapbox:", error);
      return null;
    }
  }

  private async reverseGeocodeWithOSM(
    latitude: number,
    longitude: number
  ): Promise<IGeocodingResult | null> {
    try {
      const response = await axios.get(
        "https://nominatim.openstreetmap.org/reverse",
        {
          params: {
            lat: latitude,
            lon: longitude,
            format: "json",
            addressdetails: 1,
            zoom: 18,
          },
          headers: {
            "User-Agent": "Kaa Rental Platform",
          },
        }
      );

      if (response.data) {
        const result = response.data;
        return {
          address: {
            formatted: result.display_name,
            components: this.parseOSMAddressComponents(result.address || {}),
          },
          coordinates: {
            latitude: Number.parseFloat(result.lat),
            longitude: Number.parseFloat(result.lon),
            accuracy: this.getOSMAccuracy(result.type),
          },
          type: result.type || "unknown",
          confidence: Number.parseFloat(result.importance || "0") * 100,
        };
      }

      return null;
    } catch (error) {
      console.error("Error reverse geocoding with OSM:", error);
      return null;
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
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
    return R * c;
  }

  private async generateLocationAggregations(query: any) {
    const pipeline = [
      { $match: query },
      {
        $facet: {
          counties: [
            { $group: { _id: "$county", count: { $sum: 1 } } },
            { $project: { county: "$_id", count: 1, _id: 0 } },
            { $sort: { count: -1 } },
          ],
          types: [
            { $group: { _id: "$type", count: { $sum: 1 } } },
            { $project: { type: "$_id", count: 1, _id: 0 } },
            { $sort: { count: -1 } },
          ],
          priceRanges: [
            {
              $bucket: {
                groupBy: "$economy.rentRange.average",
                boundaries: [
                  0,
                  10_000,
                  25_000,
                  50_000,
                  100_000,
                  Number.POSITIVE_INFINITY,
                ],
                default: "Unknown",
                output: { count: { $sum: 1 } },
              },
            },
            {
              $project: {
                range: {
                  $switch: {
                    branches: [
                      // biome-ignore lint/suspicious/noThenProperty: false positive
                      { case: { $eq: ["$_id", 0] }, then: "0-10,000" },
                      {
                        case: { $eq: ["$_id", 10_000] },
                        // biome-ignore lint/suspicious/noThenProperty: false positive
                        then: "10,000-25,000",
                      },
                      {
                        case: { $eq: ["$_id", 25_000] },
                        // biome-ignore lint/suspicious/noThenProperty: false positive
                        then: "25,000-50,000",
                      },
                      {
                        case: { $eq: ["$_id", 50_000] },
                        // biome-ignore lint/suspicious/noThenProperty: false positive
                        then: "50,000-100,000",
                      },
                      {
                        case: { $eq: ["$_id", 100_000] },
                        // biome-ignore lint/suspicious/noThenProperty: false positive
                        then: "100,000+",
                      },
                    ],
                    default: "Unknown",
                  },
                },
                count: 1,
                _id: 0,
              },
            },
          ],
          amenityCategories: [
            { $unwind: "$amenities" },
            { $group: { _id: "$amenities.category", count: { $sum: 1 } } },
            { $project: { category: "$_id", count: 1, _id: 0 } },
            { $sort: { count: -1 } },
          ],
        },
      },
    ];

    const [result] = await Location.aggregate(pipeline as any);

    return (
      result || {
        counties: [],
        types: [],
        priceRanges: [],
        amenityCategories: [],
      }
    );
  }

  private async generateLocationFacets() {
    const [counties, types, amenityCategories] = await Promise.all([
      Location.distinct("county"),
      Location.distinct("type"),
      Location.distinct("amenities.category"),
    ]);

    return {
      counties,
      types,
      amenityCategories,
      features: await Location.distinct("metadata.tags"),
    };
  }

  private async calculateLocationStatistics(): Promise<ILocationStatistics> {
    const [
      totalLocations,
      locationsByType,
      locationsByCounty,
      withCoordinates,
      withBoundaries,
      withAmenities,
      withImages,
      verified,
    ] = await Promise.all([
      Location.countDocuments(),
      Location.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } },
        { $project: { type: "$_id", count: 1, _id: 0 } },
      ]),
      Location.aggregate([
        { $group: { _id: "$county", count: { $sum: 1 } } },
        { $project: { county: "$_id", count: 1, _id: 0 } },
      ]),
      Location.countDocuments({ coordinates: { $exists: true } }),
      Location.countDocuments({ boundaries: { $exists: true } }),
      Location.countDocuments({ "amenities.0": { $exists: true } }),
      Location.countDocuments({ "metadata.images.0": { $exists: true } }),
      Location.countDocuments({ verifiedAt: { $exists: true } }),
    ]);

    const typeMap: Record<string, number> = {};
    for (const item of locationsByType) {
      typeMap[item.type] = item.count;
    }

    const countyMap: Record<string, number> = {};
    for (const item of locationsByCounty) {
      countyMap[item.county] = item.count;
    }

    return {
      totalLocations,
      locationsByType: typeMap,
      locationsByCounty: countyMap,
      geocodingUsage: {
        total: Array.from(this.geocodingUsage.values()).reduce(
          (sum, usage) => sum + usage.today + usage.month,
          0
        ),
        byProvider: {
          [GeocodingProvider.GOOGLE_MAPS]: 0,
          [GeocodingProvider.MAPBOX]: 0,
          [GeocodingProvider.OPENSTREETMAP]: 0,
          [GeocodingProvider.HERE_MAPS]: 0,
        },
        today: Array.from(this.geocodingUsage.values()).reduce(
          (sum, usage) => sum + usage.today,
          0
        ),
        thisMonth: Array.from(this.geocodingUsage.values()).reduce(
          (sum, usage) => sum + usage.month,
          0
        ),
      },
      searchMetrics: {
        totalSearches: 0, // This would be calculated from events
        topKeywords: [],
        popularLocations: [],
      },
      dataQuality: {
        withCoordinates,
        withBoundaries,
        withAmenities,
        withImages,
        verified,
      },
      lastUpdated: new Date(),
    };
  }

  private async logLocationEvent(
    event: Omit<ILocationEvent, "_id">
  ): Promise<void> {
    try {
      await LocationEvent.create(event);
    } catch (error) {
      console.error("Error logging location event:", error);
    }
  }

  // Geocoding helper methods
  private generateGeocodingCacheKey(
    query: string,
    provider: GeocodingProvider
  ): string {
    return crypto
      .createHash("md5")
      .update(`${query}-${provider}`)
      .digest("hex");
  }

  private async getGeocodingCache(
    key: string
  ): Promise<IGeocodingResponse | null> {
    const cached = await GeocodingCache.findOne({ queryHash: key });
    if (cached && cached.expiresAt > new Date()) {
      return cached.result as IGeocodingResponse;
    }
    return null;
  }

  private async cacheGeocodingResult(
    key: string,
    result: IGeocodingResponse
  ): Promise<void> {
    await GeocodingCache.findOneAndUpdate(
      { queryHash: key },
      {
        queryHash: key,
        provider: result.provider,
        result,
        expiresAt: new Date(
          Date.now() + LOCATION_CONFIG.GEOCODING_CACHE_TTL * 1000
        ),
      },
      { upsert: true }
    );
  }

  private async checkGeocodingUsage(provider: GeocodingProvider) {
    const key = provider;
    const now = new Date();
    let usage = this.geocodingUsage.get(key);

    if (!usage || usage.lastReset.getDate() !== now.getDate()) {
      usage = { today: 0, month: 0, lastReset: now };
      this.geocodingUsage.set(key, usage);
    }

    return await Promise.resolve(usage);
  }

  private updateGeocodingUsage(provider: GeocodingProvider): void {
    const key = provider;
    const usage = this.geocodingUsage.get(key);
    if (usage) {
      usage.today += 1;
      usage.month += 1;
    }
  }

  // Address parsing helpers
  private parseGoogleAddressComponents(components: any[]): any {
    const parsed: any = {};
    for (const comp of components) {
      const types = comp.types;
      if (types.includes("street_number")) parsed.building = comp.long_name;
      if (types.includes("route")) parsed.street = comp.long_name;
      if (types.includes("sublocality")) parsed.suburb = comp.long_name;
      if (types.includes("locality")) parsed.city = comp.long_name;
      if (types.includes("administrative_area_level_1"))
        parsed.county = comp.long_name;
      if (types.includes("postal_code")) parsed.postalCode = comp.long_name;
      if (types.includes("country")) parsed.country = comp.long_name;
    }
    return parsed;
  }

  private parseMapboxAddressComponents(feature: any): any {
    return {
      building: feature.address,
      street: feature.properties?.address,
      city: feature.context?.find((c: any) => c.id.startsWith("place"))?.text,
      county: feature.context?.find((c: any) => c.id.startsWith("region"))
        ?.text,
      country: feature.context?.find((c: any) => c.id.startsWith("country"))
        ?.text,
    };
  }

  private parseOSMAddressComponents(address: any): any {
    return {
      building: address.house_number,
      street: address.road,
      suburb: address.suburb || address.neighbourhood,
      city: address.city || address.town || address.village,
      county: address.county || address.state,
      postalCode: address.postcode,
      country: address.country,
    };
  }

  private getGoogleAccuracy(locationType: string): number {
    switch (locationType) {
      case "ROOFTOP":
        return 1;
      case "RANGE_INTERPOLATED":
        return 2;
      case "GEOMETRIC_CENTER":
        return 3;
      case "APPROXIMATE":
        return 4;
      default:
        return 5;
    }
  }

  private calculateGoogleConfidence(result: any): number {
    // Simple confidence calculation based on result types and location type
    let confidence = 50;
    if (result.geometry.location_type === "ROOFTOP") confidence += 40;
    if (result.types.includes("street_address")) confidence += 30;
    if (result.types.includes("establishment")) confidence += 20;
    return Math.min(confidence, 100);
  }

  private getOSMAccuracy(type: string): number {
    const accuracyMap: Record<string, number> = {
      house: 1,
      building: 1,
      way: 2,
      node: 2,
      relation: 3,
    };
    return accuracyMap[type] || 4;
  }

  private initializeBackgroundTasks(): void {
    // Update analytics every hour
    setInterval(() => {
      this.updateLocationStatistics();
    }, LOCATION_CONFIG.ANALYTICS_UPDATE_INTERVAL);

    // Clean up old events and cache entries daily
    setInterval(
      () => {
        this.cleanupOldData();
      },
      24 * 60 * 60 * 1000
    ); // 24 hours
  }

  private async cleanupOldData(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Clean old events
      await LocationEvent.deleteMany({
        timestamp: { $lt: thirtyDaysAgo },
      });

      // Clean expired geocoding cache
      await GeocodingCache.deleteMany({
        expiresAt: { $lt: new Date() },
      });

      console.log("Location data cleanup completed");
    } catch (error) {
      console.error("Error cleaning up location data:", error);
    }
  }
}

export const locationService = new LocationService();
