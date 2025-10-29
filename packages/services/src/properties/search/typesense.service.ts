import type { IContractor, IProperty } from "@kaa/models/types";
import { logger } from "@kaa/utils";
import {
  type Configuration,
  collection,
  configure,
  setDefaultConfiguration,
} from "typesense-ts";

// Type-safe collection schemas
export const propertiesSchema = collection({
  name: "properties",
  fields: [
    { name: "title", type: "string" },
    { name: "description", type: "string" },
    { name: "type", type: "string", facet: true },
    { name: "status", type: "string", facet: true },

    // Location fields
    { name: "geolocation", type: "geopoint" },
    { name: "address_line1", type: "string" },
    { name: "address_town", type: "string", facet: true },
    { name: "address_postal_code", type: "string" },
    { name: "location_county", type: "string", facet: true },
    { name: "location_constituency", type: "string", facet: true },
    { name: "location_ward", type: "string", facet: true },
    { name: "location_estate", type: "string" },

    // Pricing
    { name: "rent", type: "float", facet: true, sort: true },
    { name: "currency", type: "string", facet: true },
    { name: "payment_frequency", type: "string", facet: true },

    // Details
    { name: "bedrooms", type: "int32", facet: true },
    { name: "bathrooms", type: "int32", facet: true },
    { name: "total_area", type: "float", sort: true },
    { name: "furnished", type: "bool", facet: true },
    { name: "parking", type: "bool", facet: true },
    { name: "garden", type: "bool", facet: true },
    { name: "pet_friendly", type: "bool", facet: true },

    // Arrays
    { name: "features", type: "string[]", facet: true },
    { name: "amenities", type: "string[]", facet: true },

    // Availability
    { name: "available", type: "bool", facet: true },
    { name: "available_from", type: "int64", optional: true }, // Unix timestamp

    // Timestamps
    { name: "created_at", type: "int64", sort: true },
    { name: "updated_at", type: "int64", sort: true },
  ],
  default_sorting_field: "created_at",
});

export const contractorsSchema = collection({
  name: "contractors",
  fields: [
    { name: "name", type: "string" },
    { name: "company", type: "string" },
    { name: "email", type: "string" },
    { name: "phone", type: "string" },

    // Address with geolocation
    { name: "address_street", type: "string" },
    { name: "address_city", type: "string", facet: true },
    { name: "address_state", type: "string", facet: true },
    { name: "address_zip_code", type: "string" },
    { name: "address_coordinates", type: "geopoint" },

    // Arrays
    { name: "specialties", type: "string[]", facet: true },
    { name: "service_areas", type: "string[]", facet: true },

    // Metrics
    { name: "status", type: "string", facet: true },
    { name: "average_rating", type: "float", facet: true, sort: true },
    { name: "total_jobs", type: "int32", sort: true },
    { name: "completed_jobs", type: "int32", sort: true },
    { name: "on_time_percentage", type: "float", sort: true },
    { name: "emergency_available", type: "bool", facet: true },
    { name: "hourly_rate", type: "float", facet: true, sort: true },

    // Timestamps
    { name: "created_at", type: "int64", sort: true },
    { name: "updated_at", type: "int64", sort: true },
  ],
  default_sorting_field: "average_rating",
});

// Register collections globally for type safety
declare module "typesense-ts" {
  // biome-ignore lint/nursery/useConsistentTypeDefinitions: ignore
  interface Collections {
    properties: typeof propertiesSchema.schema;
    contractors: typeof contractorsSchema.schema;
  }
}

type SearchQuery = {
  query?: string;
  location?: {
    lat: number;
    lon: number;
    distance?: string;
  };
  filters?: {
    propertyType?: string[];
    priceRange?: { min?: number; max?: number };
    bedrooms?: number[];
    bathrooms?: number[];
    furnished?: boolean;
    petsAllowed?: boolean;
    features?: string[];
    specialties?: string[];
    serviceAreas?: string[];
    minRating?: number;
    emergencyAvailable?: boolean;
  };
  sort?: Array<{ field: string; order: "asc" | "desc" }>;
  pagination?: { page: number; limit: number };
};

type SearchResult<T> = {
  hits: Array<{
    id: string;
    score: number;
    document: T;
    highlight?: Record<string, { snippet?: string; snippets?: string[] }>;
    geo_distance_meters?: { [key: string]: number };
  }>;
  total: number;
  facets?: Record<string, any>;
};

class TypesenseService {
  private isConnected = false;

  constructor() {
    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      const config = configure({
        apiKey: process.env.TYPESENSE_API_KEY || "xyz",
        nodes: [
          {
            url: `${process.env.TYPESENSE_PROTOCOL || "http"}://${process.env.TYPESENSE_HOST || "localhost"}:${Number.parseInt(process.env.TYPESENSE_PORT || "8108", 10)}` as Configuration["nodes"][0]["url"],
          },
        ],
        connectionTimeoutSeconds: 10,
        numRetries: 3,
        retryIntervalSeconds: 2,
        healthcheckIntervalSeconds: 60,
      });

      setDefaultConfiguration(config);

      // Initialize collections
      await this.initializeCollections();

      this.isConnected = true;
      logger.info("Connected to Typesense");
    } catch (error) {
      logger.error("Failed to connect to Typesense:", error);
      this.isConnected = false;
    }
  }

  private async initializeCollections(): Promise<void> {
    try {
      // Create properties collection if it doesn't exist
      try {
        await propertiesSchema.retrieve();
        logger.info("Properties collection already exists");
      } catch {
        await propertiesSchema.create();
        logger.info("Properties collection created");
      }

      // Create contractors collection if it doesn't exist
      try {
        await contractorsSchema.retrieve();
        logger.info("Contractors collection already exists");
      } catch {
        await contractorsSchema.create();
        logger.info("Contractors collection created");
      }
    } catch (error) {
      logger.error("Failed to initialize Typesense collections:", error);
    }
  }

  async indexProperty(property: IProperty): Promise<void> {
    if (!this.isConnected) {
      logger.warn("Typesense not connected, skipping property indexing");
      return;
    }

    try {
      const document = {
        id: (property._id as any).toString(),
        title: property.title,
        description: property.description,
        type: property.type,
        status: property.status,

        // Geolocation - Typesense expects [lat, lon]
        geolocation: (property.geolocation?.coordinates as [number, number])
          ? ([
              property.geolocation.coordinates[1],
              property.geolocation.coordinates[0],
            ] as [number, number])
          : ([0, 0] as [number, number]), // Default fallback

        // Flatten address
        address_line1: property.location.address?.line1 || "",
        address_town: property.location.address?.town || "",
        address_postal_code: property.location.address?.postalCode || "",
        location_county: property.location.county || "",
        location_constituency: property.location.constituency || "",
        location_ward: property.location.ward || "",
        location_estate: property.location.estate || "",

        // Pricing
        rent: property.pricing?.rent || 0,
        currency: property.pricing?.currency || "KES",
        payment_frequency: property.pricing?.paymentFrequency || "monthly",

        // Details
        bedrooms: property.specifications?.bedrooms || 0,
        bathrooms: property.specifications?.bathrooms || 0,
        total_area: property.specifications?.totalArea || 0,
        furnished: property.specifications?.furnished === "fully_furnished",
        parking: property.amenities?.parking,
        garden: property.amenities?.garden,
        pet_friendly: property.rules?.petsAllowed,

        // Arrays
        features: Object.keys(property.amenities)?.map((a) => a) || [],
        amenities: Object.keys(property.amenities)?.map((a) => a) || [],

        // Availability
        available: property.availability?.isAvailable,
        available_from: property.availability?.availableFrom
          ? new Date(property.availability.availableFrom).getTime() / 1000
          : undefined,

        // Timestamps (convert to Unix timestamp in seconds)
        created_at: property.createdAt
          ? new Date(property.createdAt).getTime() / 1000
          : Date.now() / 1000,
        updated_at: property.updatedAt
          ? new Date(property.updatedAt).getTime() / 1000
          : Date.now() / 1000,
      };

      await propertiesSchema.documents.create(document);
      logger.debug(`Property ${property._id} indexed successfully`);
    } catch (error) {
      logger.error(`Failed to index property ${property._id}:`, error);
    }
  }

  async indexContractor(contractor: IContractor): Promise<void> {
    if (!this.isConnected) {
      logger.warn("Typesense not connected, skipping contractor indexing");
      return;
    }

    try {
      const document = {
        id: (contractor._id as any).toString(),
        name: contractor.name,
        company: contractor.company || "",
        email: contractor.email,
        phone: contractor.phone || "",

        // Address
        address_street: contractor.address?.street || "",
        address_city: contractor.address?.city || "",
        address_state: contractor.address?.state || "",
        address_zip_code: contractor.address?.zipCode || "",
        address_coordinates: contractor.address?.coordinates
          ? ([
              contractor.address.coordinates.lat,
              contractor.address.coordinates.lon,
            ] as [number, number])
          : ([0, 0] as [number, number]),

        // Arrays
        specialties: contractor.specialties || [],
        service_areas: contractor.serviceAreas || [],

        // Metrics
        status: contractor.status,
        average_rating: contractor.averageRating || 0,
        total_jobs: contractor.totalJobs || 0,
        completed_jobs: contractor.completedJobs || 0,
        on_time_percentage: contractor.onTimePercentage || 0,
        emergency_available: contractor.emergencyAvailable,
        hourly_rate: contractor.hourlyRate || 0,

        // Timestamps
        created_at: contractor.createdAt
          ? new Date(contractor.createdAt).getTime() / 1000
          : Date.now() / 1000,
        updated_at: contractor.updatedAt
          ? new Date(contractor.updatedAt).getTime() / 1000
          : Date.now() / 1000,
      };

      await contractorsSchema.documents.create(document);
      logger.debug(`Contractor ${contractor._id} indexed successfully`);
    } catch (error) {
      logger.error(`Failed to index contractor ${contractor._id}:`, error);
    }
  }

  async searchProperties(searchQuery: SearchQuery): Promise<SearchResult<any>> {
    if (!this.isConnected) {
      throw new Error("Typesense not connected");
    }

    const { query, location, filters, sort, pagination } = searchQuery;
    const { page = 1, limit = 10 } = pagination || {};

    // Build filter string
    const filterParts: string[] = [];

    // Always filter for available properties
    filterParts.push("available:=true");

    if (filters) {
      if (filters.propertyType?.length) {
        const types = filters.propertyType.map((t) => `\`${t}\``).join(",");
        filterParts.push(`type:[${types}]`);
      }

      if (filters.priceRange) {
        if (filters.priceRange.min !== undefined) {
          filterParts.push(`rent_amount:>=${filters.priceRange.min}`);
        }
        if (filters.priceRange.max !== undefined) {
          filterParts.push(`rent_amount:<=${filters.priceRange.max}`);
        }
      }

      if (filters.bedrooms?.length) {
        const bedroomFilter = filters.bedrooms
          .map((b) => `bedrooms:=${b}`)
          .join(" || ");
        filterParts.push(`(${bedroomFilter})`);
      }

      if (filters.bathrooms?.length) {
        const bathroomFilter = filters.bathrooms
          .map((b) => `bathrooms:=${b}`)
          .join(" || ");
        filterParts.push(`(${bathroomFilter})`);
      }

      if (filters.furnished !== undefined) {
        filterParts.push(`furnished:=${filters.furnished}`);
      }

      if (filters.petsAllowed !== undefined) {
        filterParts.push(`pet_friendly:=${filters.petsAllowed}`);
      }

      if (filters.features?.length) {
        const featuresFilter = filters.features
          .map((f) => `features:=\`${f}\``)
          .join(" && ");
        filterParts.push(`(${featuresFilter})`);
      }
    }

    // Geo-distance filter
    if (location) {
      const distance = location.distance || "10 km";
      filterParts.push(
        `geolocation:(${location.lat}, ${location.lon}, ${distance})`
      );
    }

    // Build sort string
    let sortBy = "created_at:desc";
    if (sort?.length) {
      sortBy = sort.map((s) => `${s.field}:${s.order}`).join(",");
    } else if (location) {
      // Sort by distance for geo queries
      sortBy = `geolocation(${location.lat}, ${location.lon}):asc`;
    }

    try {
      const response = await propertiesSchema.search({
        q: query || "*",
        query_by: ["title", "description", "address_line1", "location_estate"],
        filter_by: filterParts.join(" && ") || undefined,
        sort_by: sortBy,
        page,
        per_page: limit,
        highlight_full_fields: ["title", "description", "address_line1"],
        facet_by: [
          "type",
          "location_county",
          "bedrooms",
          "bathrooms",
          "furnished",
        ],
      });

      return {
        hits: response.hits.map((hit) => ({
          // @ts-expect-error
          id: hit.document.id as string,
          score: hit.text_match,
          document: hit.document,
          highlight: hit.highlight,
          // @ts-expect-error
          geo_distance_meters: hit.geo_distance_meters,
        })),
        total: response.found,
        facets: response.facet_counts,
      };
    } catch (error) {
      logger.error("Typesense search failed:", error);
      throw error;
    }
  }

  async searchContractors(
    searchQuery: Omit<SearchQuery, "filters"> & {
      filters?: {
        specialties?: string[];
        serviceAreas?: string[];
        minRating?: number;
        emergencyAvailable?: boolean;
        priceRange?: { min?: number; max?: number };
      };
    }
  ): Promise<SearchResult<any>> {
    if (!this.isConnected) {
      throw new Error("Typesense not connected");
    }

    const { query, location, filters, sort, pagination } = searchQuery;
    const { page = 1, limit = 10 } = pagination || {};

    const filterParts: string[] = [];

    // Always filter for active contractors
    filterParts.push("status:=`active`");

    if (filters) {
      if (filters.specialties?.length) {
        const specialtiesFilter = filters.specialties
          .map((s) => `specialties:=\`${s}\``)
          .join(" || ");
        filterParts.push(`(${specialtiesFilter})`);
      }

      if (filters.serviceAreas?.length) {
        const areasFilter = filters.serviceAreas
          .map((a) => `service_areas:=\`${a}\``)
          .join(" || ");
        filterParts.push(`(${areasFilter})`);
      }

      if (filters.minRating !== undefined) {
        filterParts.push(`average_rating:>=${filters.minRating}`);
      }

      if (filters.emergencyAvailable !== undefined) {
        filterParts.push(`emergency_available:=${filters.emergencyAvailable}`);
      }

      if (filters.priceRange) {
        if (filters.priceRange.min !== undefined) {
          filterParts.push(`hourly_rate:>=${filters.priceRange.min}`);
        }
        if (filters.priceRange.max !== undefined) {
          filterParts.push(`hourly_rate:<=${filters.priceRange.max}`);
        }
      }
    }

    // Geo-distance filter
    if (location) {
      const distance = location.distance || "50 km";
      filterParts.push(
        `address_coordinates:(${location.lat}, ${location.lon}, ${distance})`
      );
    }

    // Build sort string
    let sortBy = "average_rating:desc,completed_jobs:desc";
    if (sort?.length) {
      sortBy = sort.map((s) => `${s.field}:${s.order}`).join(",");
    }

    try {
      const response = await contractorsSchema.search({
        q: query || "*",
        query_by: ["name", "company", "specialties"],
        filter_by: filterParts.join(" && ") || undefined,
        sort_by: sortBy,
        page,
        per_page: limit,
        highlight_full_fields: ["name", "company", "specialties"],
        facet_by: ["specialties", "service_areas", "emergency_available"],
      });

      return {
        hits: response.hits.map((hit) => ({
          id: hit.document.id,
          score: hit.text_match,
          document: hit.document,
          highlight: hit.highlight as Record<
            string,
            { snippet?: string; snippets?: string[] }
          >,
          // @ts-expect-error
          geo_distance_meters: hit.geo_distance_meters,
        })),
        total: response.found,
        facets: response.facet_counts,
      };
    } catch (error) {
      logger.error("Typesense contractor search failed:", error);
      throw error;
    }
  }

  async getSuggestions(
    query: string,
    type: "properties" | "contractors" = "properties"
  ): Promise<string[]> {
    if (!(this.isConnected && query)) {
      return [];
    }

    try {
      const schema =
        // @ts-expect-error
        type === "properties" ? propertiesSchema : contractorsSchema;
      const field = type === "properties" ? "title" : "name";

      const response = await schema.search({
        q: query,
        query_by: [field as any],
        per_page: 10,
        prefix: true,
      });

      return response.hits.map(
        (hit) =>
          hit.document[field as unknown as keyof typeof hit.document] as string
      );
    } catch (error) {
      logger.error("Failed to get suggestions:", error);
      return [];
    }
  }

  async deleteDocument(collection: string, id: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      const schema =
        collection === "properties" ? propertiesSchema : contractorsSchema;
      await schema.documents.delete({ documentId: id });
      logger.debug(`Document ${id} deleted from ${collection}`);
    } catch (error) {
      logger.error(
        `Failed to delete document ${id} from ${collection}:`,
        error
      );
    }
  }

  async bulkIndex(
    collection: string,
    documents: Array<{ id: string; body: any }>
  ): Promise<void> {
    if (!(this.isConnected && documents.length)) {
      return;
    }

    console.log("bulkIndex", collection, documents);

    try {
      const schema =
        collection === "properties" ? propertiesSchema : contractorsSchema;
      const formattedDocs = documents.map((doc) => ({
        id: doc.id,
        ...doc.body,
      }));

      console.log("formattedDocs", formattedDocs);

      const results = await schema.documents.import(formattedDocs, {
        action: "upsert",
        return_doc: true,
      });

      console.log("results", results);

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      logger.info(
        `Bulk indexed ${successCount} documents to ${collection}, ${failCount} failed`
      );

      if (failCount > 0) {
        const errors = results.filter((r) => !r.success);
        logger.error("Bulk indexing errors:", errors);
      }
    } catch (error) {
      logger.error("Bulk indexing failed:", error);
    }
  }

  async reindexAll(): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Typesense not connected");
    }

    try {
      // Import models dynamically to avoid circular dependencies
      const Property = (await import("@kaa/models")).Property;
      const Contractor = (await import("@kaa/models")).Contractor;

      logger.info("Starting full reindex...");

      // Reindex properties
      const properties = await Property.find({}).lean();
      const propertyDocs = properties.map((property) => ({
        id: property._id.toString(),
        body: {
          title: property.title,
          description: property.description,
          type: property.type,
          status: property.status,
          geolocation: property.geolocation?.coordinates
            ? [
                property.geolocation.coordinates[1],
                property.geolocation.coordinates[0],
              ]
            : [0, 0],
          address_line1: property.location.address?.line1 || "",
          address_town: property.location.address?.town || "",
          address_postal_code: property.location.address?.postalCode || "",
          location_county: property.location.county || "",
          location_constituency: property.location.constituency || "",
          location_ward: property.location.ward || "",
          location_estate: property.location.estate || "",
          rent: property.pricing?.rent || 0,
          currency: property.pricing?.currency || "KES",
          payment_frequency: property.pricing?.paymentFrequency || "monthly",
          bedrooms: property.specifications?.bedrooms || 0,
          bathrooms: property.specifications?.bathrooms || 0,
          total_area: property.specifications?.totalArea || 0,
          furnished: property.specifications?.furnished === "fully_furnished",
          parking: property.amenities?.parking,
          garden: property.amenities?.garden,
          pet_friendly: property.rules?.petsAllowed,
          features: Object.keys(property.amenities)?.map((a) => a) || [],
          amenities: Object.keys(property.amenities)?.map((a) => a) || [],
          available: property.availability?.isAvailable,
          available_from: property.availability?.availableFrom
            ? new Date(property.availability.availableFrom).getTime() / 1000
            : undefined,
          created_at: property.createdAt
            ? Math.floor(new Date(property.createdAt).getTime() / 1000)
            : Math.floor(Date.now() / 1000),
          updated_at: property.updatedAt
            ? Math.floor(new Date(property.updatedAt).getTime() / 1000)
            : Math.floor(Date.now() / 1000),
        },
      }));

      await this.bulkIndex("properties", propertyDocs);

      // Reindex contractors
      const contractors = await Contractor.find({}).lean();
      const contractorDocs = contractors.map((contractor) => ({
        id: contractor._id.toString(),
        body: {
          name: contractor.name,
          company: contractor.company || "",
          email: contractor.email,
          phone: contractor.phone || "",
          address_street: contractor.address?.street || "",
          address_city: contractor.address?.city || "",
          address_state: contractor.address?.state || "",
          address_zip_code: contractor.address?.zipCode || "",
          address_coordinates: contractor.address?.coordinates
            ? [
                contractor.address.coordinates.lat,
                contractor.address.coordinates.lon,
              ]
            : [0, 0],
          specialties: contractor.specialties || [],
          service_areas: contractor.serviceAreas || [],
          status: contractor.status,
          average_rating: contractor.averageRating || 0,
          total_jobs: contractor.totalJobs || 0,
          completed_jobs: contractor.completedJobs || 0,
          on_time_percentage: contractor.onTimePercentage || 0,
          emergency_available: contractor.emergencyAvailable,
          hourly_rate: contractor.hourlyRate || 0,
          created_at: contractor.createdAt
            ? new Date(contractor.createdAt).getTime() / 1000
            : Date.now() / 1000,
          updated_at: contractor.updatedAt
            ? new Date(contractor.updatedAt).getTime() / 1000
            : Date.now() / 1000,
        },
      }));

      await this.bulkIndex("contractors", contractorDocs);

      logger.info("Reindexing completed successfully");
    } catch (error) {
      logger.error("Reindexing failed:", error);
      throw error;
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}

export const typesenseService = new TypesenseService();
export type { SearchQuery, SearchResult };
