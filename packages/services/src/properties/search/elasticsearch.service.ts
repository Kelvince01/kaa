import { Client } from "@elastic/elasticsearch";
import type { IContractor, IProperty } from "@kaa/models/types";
import { logger } from "@kaa/utils";

// import type { SearchTotalHits } from "@elastic/elasticsearch/api/types";

type ElasticsearchConfig = {
  node: string;
  auth?: {
    username: string;
    password: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
};

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
    _id: string;
    _score: number;
    _source: T;
    highlight?: Record<string, string[]>;
  }>;
  total: number;
  aggregations?: Record<string, any>;
};

class ElasticsearchService {
  private readonly client: Client;
  private isConnected = false;

  constructor() {
    const config: ElasticsearchConfig = {
      node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
    };

    if (
      process.env.ELASTICSEARCH_USERNAME &&
      process.env.ELASTICSEARCH_PASSWORD
    ) {
      config.auth = {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
      };
    }

    if (process.env.NODE_ENV === "production") {
      config.tls = {
        rejectUnauthorized: false,
      };
    }

    this.client = new Client(config);
    this.connect();
  }

  private async connect(): Promise<void> {
    try {
      await this.client.ping();
      this.isConnected = true;
      logger.info("Connected to Elasticsearch");

      // Initialize indices
      await this.initializeIndices();
    } catch (error) {
      logger.error("Failed to connect to Elasticsearch:", error);
      this.isConnected = false;
    }
  }

  private async initializeIndices(): Promise<void> {
    try {
      // Create properties index
      const propertiesIndexExists = await this.client.indices.exists({
        index: "properties",
      });

      if (!propertiesIndexExists) {
        await this.client.indices.create({
          index: "properties",
          mappings: {
            properties: {
              title: {
                type: "text",
                analyzer: "standard",
                fields: {
                  keyword: { type: "keyword" },
                  suggest: { type: "completion" },
                },
              },
              description: {
                type: "text",
                analyzer: "standard",
              },
              type: { type: "keyword" },
              status: { type: "keyword" },
              location: {
                properties: {
                  coordinates: { type: "geo_point" },
                  address: {
                    properties: {
                      line1: { type: "text", analyzer: "standard" },
                      town: { type: "keyword" },
                      postalCode: { type: "keyword" },
                      county: { type: "keyword" },
                    },
                  },
                  county: { type: "keyword" },
                  constituency: { type: "keyword" },
                  ward: { type: "keyword" },
                  estate: { type: "keyword" },
                },
              },
              geolocation: { type: "geo_point" },
              pricing: {
                properties: {
                  rentAmount: { type: "float" },
                  currency: { type: "keyword" },
                  paymentFrequency: { type: "keyword" },
                },
              },
              details: {
                properties: {
                  bedrooms: { type: "integer" },
                  bathrooms: { type: "integer" },
                  size: { type: "float" },
                  furnished: { type: "boolean" },
                  parking: { type: "boolean" },
                  garden: { type: "boolean" },
                  petFriendly: { type: "boolean" },
                },
              },
              features: { type: "keyword" },
              amenities: {
                type: "nested",
                properties: {
                  name: { type: "keyword" },
                  category: { type: "keyword" },
                },
              },
              available: { type: "boolean" },
              availableFrom: { type: "date" },
              createdAt: { type: "date" },
              updatedAt: { type: "date" },
            },
          },
          settings: {
            analysis: {
              analyzer: {
                property_analyzer: {
                  type: "custom",
                  tokenizer: "standard",
                  filter: ["lowercase", "stop", "snowball"],
                },
              },
            },
          },
        });

        logger.info("Properties index created");
      }

      // Create contractors index
      const contractorsIndexExists = await this.client.indices.exists({
        index: "contractors",
      });

      if (!contractorsIndexExists) {
        await this.client.indices.create({
          index: "contractors",
          mappings: {
            properties: {
              name: {
                type: "text",
                analyzer: "standard",
                fields: {
                  keyword: { type: "keyword" },
                  suggest: { type: "completion" },
                },
              },
              company: { type: "text", analyzer: "standard" },
              email: { type: "keyword" },
              phone: { type: "keyword" },
              address: {
                properties: {
                  street: { type: "text" },
                  city: { type: "keyword" },
                  state: { type: "keyword" },
                  zipCode: { type: "keyword" },
                  coordinates: { type: "geo_point" },
                },
              },
              specialties: { type: "keyword" },
              status: { type: "keyword" },
              serviceAreas: { type: "keyword" },
              averageRating: { type: "float" },
              totalJobs: { type: "integer" },
              completedJobs: { type: "integer" },
              onTimePercentage: { type: "float" },
              emergencyAvailable: { type: "boolean" },
              hourlyRate: { type: "float" },
              availability: {
                type: "object",
                enabled: false,
              },
              createdAt: { type: "date" },
              updatedAt: { type: "date" },
            },
          },
          settings: {
            analysis: {
              analyzer: {
                contractor_analyzer: {
                  type: "custom",
                  tokenizer: "standard",
                  filter: ["lowercase", "stop", "snowball"],
                },
              },
            },
          },
        });
        logger.info("Contractors index created");
      }
    } catch (error) {
      logger.error("Failed to initialize Elasticsearch indices:", error);
    }
  }

  async indexProperty(property: IProperty): Promise<void> {
    if (!this.isConnected) {
      logger.warn("Elasticsearch not connected, skipping property indexing");
      return;
    }

    try {
      const document = {
        title: property.title,
        description: property.description,
        type: property.type,
        status: property.status,
        location: {
          coordinates: property.geolocation?.coordinates
            ? {
                lat: property.geolocation.coordinates[1],
                lon: property.geolocation.coordinates[0],
              }
            : null,
          address: property.location.address,
          county: property.location.county,
          constituency: property.location.constituency,
          ward: property.location.ward,
          estate: property.location.estate,
        },
        geolocation: property.geolocation?.coordinates
          ? {
              lat: property.geolocation.coordinates[1],
              lon: property.geolocation.coordinates[0],
            }
          : null,
        pricing: property.pricing,
        details: property.specifications,
        features: property.featured || [],
        amenities: property.amenities || [],
        available: property.availability.isAvailable,
        availableFrom: property.availability.availableFrom || undefined,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      };

      await this.client.index({
        index: "properties",
        id: (property._id as any).toString(),
        body: document,
      });

      logger.debug(`Property ${property._id} indexed successfully`);
    } catch (error) {
      logger.error(`Failed to index property ${property._id}:`, error);
    }
  }

  async indexContractor(contractor: IContractor): Promise<void> {
    if (!this.isConnected) {
      logger.warn("Elasticsearch not connected, skipping contractor indexing");
      return;
    }

    try {
      const document = {
        name: contractor.name,
        company: contractor.company,
        email: contractor.email,
        phone: contractor.phone,
        address: contractor.address,
        specialties: contractor.specialties,
        status: contractor.status,
        serviceAreas: contractor.serviceAreas,
        averageRating: contractor.averageRating,
        totalJobs: contractor.totalJobs,
        completedJobs: contractor.completedJobs,
        onTimePercentage: contractor.onTimePercentage,
        emergencyAvailable: contractor.emergencyAvailable,
        hourlyRate: contractor.hourlyRate,
        availability: contractor.availability,
        createdAt: contractor.createdAt,
        updatedAt: contractor.updatedAt,
      };

      await this.client.index({
        index: "contractors",
        id: (contractor._id as any).toString(),
        body: document,
      });

      logger.debug(`Contractor ${contractor._id} indexed successfully`);
    } catch (error) {
      logger.error(`Failed to index contractor ${contractor._id}:`, error);
    }
  }

  async searchProperties(
    searchQuery: SearchQuery
  ): Promise<SearchResult<IProperty>> {
    if (!this.isConnected) {
      throw new Error("Elasticsearch not connected");
    }

    const { query, location, filters, sort, pagination } = searchQuery;
    const { page = 1, limit = 10 } = pagination || {};

    const esQuery: any = {
      bool: {
        must: [],
        filter: [],
        should: [],
      },
    };

    // Text search
    if (query) {
      esQuery.bool.must.push({
        multi_match: {
          query,
          fields: [
            "title^2",
            "description",
            "location.address.line1",
            "location.estate",
          ],
          type: "best_fields",
          fuzziness: "AUTO",
        },
      });
    }

    // Geo-distance search
    if (location) {
      esQuery.bool.filter.push({
        geo_distance: {
          distance: location.distance || "10km",
          geolocation: {
            lat: location.lat,
            lon: location.lon,
          },
        },
      });
    }

    // Filters
    if (filters) {
      if (filters.propertyType?.length) {
        esQuery.bool.filter.push({
          terms: { type: filters.propertyType },
        });
      }

      if (filters.priceRange) {
        const priceFilter: any = {};
        if (filters.priceRange.min) priceFilter.gte = filters.priceRange.min;
        if (filters.priceRange.max) priceFilter.lte = filters.priceRange.max;

        if (Object.keys(priceFilter).length > 0) {
          esQuery.bool.filter.push({
            range: { "pricing.rentAmount": priceFilter },
          });
        }
      }

      if (filters.bedrooms?.length) {
        esQuery.bool.filter.push({
          terms: { "details.bedrooms": filters.bedrooms },
        });
      }

      if (filters.bathrooms?.length) {
        esQuery.bool.filter.push({
          terms: { "details.bathrooms": filters.bathrooms },
        });
      }

      if (filters.furnished !== undefined) {
        esQuery.bool.filter.push({
          term: { "details.furnished": filters.furnished },
        });
      }

      if (filters.petsAllowed !== undefined) {
        esQuery.bool.filter.push({
          term: { "details.petFriendly": filters.petsAllowed },
        });
      }

      if (filters.features?.length) {
        esQuery.bool.filter.push({
          terms: { features: filters.features },
        });
      }
    }

    // Always filter for available properties
    esQuery.bool.filter.push({ term: { available: true } });

    // Build sort
    const esSort: any[] = [];
    if (sort?.length) {
      for (const s of sort) {
        esSort.push({ [s.field]: { order: s.order } });
      }
    } else if (location) {
      // Default to distance sorting for geo queries
      esSort.push({
        _geo_distance: {
          geolocation: {
            lat: location.lat,
            lon: location.lon,
          },
          order: "asc",
          unit: "km",
        },
      });
    } else {
      esSort.push({ createdAt: { order: "desc" } });
    }

    try {
      const response = await this.client.search({
        index: "properties",
        query: esQuery,
        sort: esSort,
        from: (page - 1) * limit,
        size: limit,
        highlight: {
          fields: {
            title: {},
            description: {},
            "location.address.line1": {},
          },
        },
        aggs: {
          property_types: {
            terms: { field: "type" },
          },
          price_ranges: {
            range: {
              field: "pricing.rentAmount",
              ranges: [
                { to: 50_000 },
                { from: 50_000, to: 100_000 },
                { from: 100_000, to: 200_000 },
                { from: 200_000 },
              ],
            },
          },
          bedrooms: {
            terms: { field: "details.bedrooms" },
          },
          counties: {
            terms: { field: "location.county" },
          },
        },
      });

      return {
        // TODO - fix type
        hits: response.hits.hits as any,
        total: (response.hits.total as any)?.value || 0,
        aggregations: response.aggregations,
      };
    } catch (error) {
      logger.error("Elasticsearch search failed:", error);
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
  ): Promise<SearchResult<IContractor>> {
    if (!this.isConnected) {
      throw new Error("Elasticsearch not connected");
    }

    const { query, location, filters, sort, pagination } = searchQuery;
    const { page = 1, limit = 10 } = pagination || {};

    const esQuery: any = {
      bool: {
        must: [],
        filter: [],
        should: [],
      },
    };

    // Text search
    if (query) {
      esQuery.bool.must.push({
        multi_match: {
          query,
          fields: ["name^2", "company", "specialties"],
          type: "best_fields",
          fuzziness: "AUTO",
        },
      });
    }

    // Geo-distance search
    if (location) {
      esQuery.bool.filter.push({
        geo_distance: {
          distance: location.distance || "50km",
          "address.coordinates": {
            lat: location.lat,
            lon: location.lon,
          },
        },
      });
    }

    // Filters
    if (filters) {
      if (filters.specialties?.length) {
        esQuery.bool.filter.push({
          terms: { specialties: filters.specialties },
        });
      }

      if (filters.serviceAreas?.length) {
        esQuery.bool.filter.push({
          terms: { serviceAreas: filters.serviceAreas },
        });
      }

      if (filters.minRating) {
        esQuery.bool.filter.push({
          range: { averageRating: { gte: filters.minRating } },
        });
      }

      if (filters.emergencyAvailable !== undefined) {
        esQuery.bool.filter.push({
          term: { emergencyAvailable: filters.emergencyAvailable },
        });
      }

      if (filters.priceRange) {
        const priceFilter: any = {};
        if (filters.priceRange.min) priceFilter.gte = filters.priceRange.min;
        if (filters.priceRange.max) priceFilter.lte = filters.priceRange.max;

        if (Object.keys(priceFilter).length > 0) {
          esQuery.bool.filter.push({
            range: { hourlyRate: priceFilter },
          });
        }
      }
    }

    // Always filter for active contractors
    esQuery.bool.filter.push({ term: { status: "active" } });

    // Build sort
    const esSort: any[] = [];
    if (sort?.length) {
      for (const s of sort) {
        esSort.push({ [s.field]: { order: s.order } });
      }
    } else {
      esSort.push({ averageRating: { order: "desc" } });
      esSort.push({ completedJobs: { order: "desc" } });
    }

    try {
      const response = await this.client.search({
        index: "contractors",
        query: esQuery,
        sort: esSort,
        from: (page - 1) * limit,
        size: limit,
        highlight: {
          fields: {
            name: {},
            company: {},
            specialties: {},
          },
        },
        aggs: {
          specialties: {
            terms: { field: "specialties" },
          },
          service_areas: {
            terms: { field: "serviceAreas" },
          },
          rating_ranges: {
            range: {
              field: "averageRating",
              ranges: [
                { from: 4.5 },
                { from: 4.0, to: 4.5 },
                { from: 3.5, to: 4.0 },
                { to: 3.5 },
              ],
            },
          },
        },
      });

      return {
        hits: response.hits.hits as any,
        total: (response.hits.total as any)?.value || 0,
        aggregations: response.aggregations,
      };
    } catch (error) {
      logger.error("Elasticsearch contractor search failed:", error);
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
      const field = type === "properties" ? "title.suggest" : "name.suggest";

      const response = await this.client.search({
        index: type,
        suggest: {
          suggestions: {
            prefix: query,
            completion: {
              field,
              size: 10,
            },
          },
        },
      });

      const suggestions = response.suggest?.suggestions?.[0]?.options || [];
      return (suggestions as any[]).map((option: any) => option.text);
    } catch (error) {
      logger.error("Failed to get suggestions:", error);
      return [];
    }
  }

  async deleteDocument(index: string, id: string): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.client.delete({
        index,
        id,
      });
      logger.debug(`Document ${id} deleted from ${index}`);
    } catch (error) {
      logger.error(`Failed to delete document ${id} from ${index}:`, error);
    }
  }

  async bulkIndex(
    index: string,
    documents: Array<{ id: string; body: any }>
  ): Promise<void> {
    if (!(this.isConnected && documents.length)) {
      return;
    }

    try {
      const operations = documents.flatMap((doc) => [
        { index: { _index: index, _id: doc.id } },
        doc.body,
      ]);

      const response = await this.client.bulk({
        operations,
      });

      if (response.errors) {
        logger.error("Bulk indexing errors:", response.items);
      } else {
        logger.info(`Bulk indexed ${documents.length} documents to ${index}`);
      }
    } catch (error) {
      logger.error("Bulk indexing failed:", error);
    }
  }

  async reindexAll(): Promise<void> {
    if (!this.isConnected) {
      throw new Error("Elasticsearch not connected");
    }

    try {
      // Import models dynamically to avoid circular dependencies
      const Property = (await import("@kaa/models")).Property;
      const Contractor = (await import("@kaa/models")).Contractor;

      // Reindex properties
      const properties = await Property.find({}).lean();
      const propertyDocs = properties.map((property) => ({
        id: property._id.toString(),
        body: {
          title: property.title,
          description: property.description,
          type: property.type,
          status: property.status,
          location: property.location,
          geolocation: property.geolocation?.coordinates
            ? {
                lat: property.geolocation.coordinates[1],
                lon: property.geolocation.coordinates[0],
              }
            : null,
          pricing: property.pricing,
          details: property.specifications,
          specifications: property.specifications,
          featured: property.featured || [],
          amenities: property.amenities || [],
          availability: property.availability,
          createdAt: property.createdAt,
          updatedAt: property.updatedAt,
        },
      }));

      await this.bulkIndex("properties", propertyDocs);

      // Reindex contractors
      const contractors = await Contractor.find({}).lean();
      const contractorDocs = contractors.map((contractor) => ({
        id: contractor._id.toString(),
        body: {
          name: contractor.name,
          company: contractor.company,
          email: contractor.email,
          phone: contractor.phone,
          address: contractor.address,
          specialties: contractor.specialties,
          status: contractor.status,
          serviceAreas: contractor.serviceAreas,
          averageRating: contractor.averageRating,
          totalJobs: contractor.totalJobs,
          completedJobs: contractor.completedJobs,
          onTimePercentage: contractor.onTimePercentage,
          emergencyAvailable: contractor.emergencyAvailable,
          hourlyRate: contractor.hourlyRate,
          availability: contractor.availability,
          createdAt: contractor.createdAt,
          updatedAt: contractor.updatedAt,
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

export const elasticsearchService = new ElasticsearchService();
export type { SearchQuery, SearchResult };
