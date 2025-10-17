/**
 * Search configuration and constants
 */

export const SEARCH_CONFIG = {
    // Elasticsearch settings
    elasticsearch: {
        maxResultsPerPage: 100,
        defaultPageSize: 10,
        maxSearchDepth: 10_000,
        highlightFragmentSize: 150,
        highlightNumberOfFragments: 3,
        suggestionSize: 10,

        // Index settings
        indices: {
            properties: 'properties',
            contractors: 'contractors'
        },

        // Search timeouts
        searchTimeout: '30s',
        indexTimeout: '60s',

        // Geo search defaults
        defaultGeoDistance: '10km',
        maxGeoDistance: '100km',

        // Fuzzy search settings
        fuzziness: 'AUTO',
        prefixLength: 2,
        maxExpansions: 50
    },

    // Analytics settings
    analytics: {
        maxEventsInMemory: 10_000,
        defaultAnalyticsPeriodHours: 24,
        slowSearchThresholdMs: 1000,
        maxAnalyticsExportHours: 168 // 7 days
    },

    // Rate limiting
    rateLimiting: {
        windowMs: 60 * 1000, // 1 minute
        maxRequestsPerWindow: 100,
        skipSuccessfulRequests: false,
        skipFailedRequests: false
    },

    // Search validation
    validation: {
        minQueryLength: 1,
        maxQueryLength: 500,
        maxFiltersPerRequest: 20,

        // Geo validation
        minLatitude: -90,
        maxLatitude: 90,
        minLongitude: -180,
        maxLongitude: 180,

        // Pagination limits
        maxPage: 1000,
        maxLimit: 100,

        // Price range limits
        maxPriceValue: 10_000_000, // 10M
        minPriceValue: 0
    },

    // Feature flags
    features: {
        enableSuggestions: true,
        enableAnalytics: true,
        enableGeoSearch: true,
        enableHighlighting: true,
        enableAggregations: true,
        enableFuzzySearch: true
    }
} as const;

/**
 * Search field mappings for different entity types
 */
export const SEARCH_FIELDS = {
    properties: {
        text: ['title^2', 'description', 'location.address.line1', 'location.estate'],
        suggest: 'title.suggest',
        highlight: ['title', 'description', 'location.address.line1'],
        sort: {
            relevance: '_score',
            price: 'pricing.rentAmount',
            date: 'createdAt',
            distance: '_geo_distance'
        }
    },
    contractors: {
        text: ['name^2', 'company', 'specialties'],
        suggest: 'name.suggest',
        highlight: ['name', 'company', 'specialties'],
        sort: {
            relevance: '_score',
            rating: 'averageRating',
            jobs: 'completedJobs',
            rate: 'hourlyRate',
            distance: '_geo_distance'
        }
    }
} as const;

/**
 * Aggregation configurations
 */
export const AGGREGATIONS = {
    properties: {
        property_types: {
            terms: { field: 'type', size: 20 }
        },
        price_ranges: {
            range: {
                field: 'pricing.rentAmount',
                ranges: [
                    { key: 'under_50k', to: 50_000 },
                    { key: '50k_100k', from: 50_000, to: 100_000 },
                    { key: '100k_200k', from: 100_000, to: 200_000 },
                    { key: 'over_200k', from: 200_000 }
                ]
            }
        },
        bedrooms: {
            terms: { field: 'details.bedrooms', size: 10 }
        },
        bathrooms: {
            terms: { field: 'details.bathrooms', size: 10 }
        },
        counties: {
            terms: { field: 'location.county', size: 47 } // Kenya has 47 counties
        },
        furnished: {
            terms: { field: 'details.furnished' }
        },
        features: {
            terms: { field: 'features', size: 20 }
        }
    },
    contractors: {
        specialties: {
            terms: { field: 'specialties', size: 20 }
        },
        service_areas: {
            terms: { field: 'serviceAreas', size: 50 }
        },
        rating_ranges: {
            range: {
                field: 'averageRating',
                ranges: [
                    { key: 'excellent', from: 4.5 },
                    { key: 'very_good', from: 4.0, to: 4.5 },
                    { key: 'good', from: 3.5, to: 4.0 },
                    { key: 'fair', to: 3.5 }
                ]
            }
        },
        rate_ranges: {
            range: {
                field: 'hourlyRate',
                ranges: [
                    { key: 'budget', to: 1000 },
                    { key: 'standard', from: 1000, to: 2500 },
                    { key: 'premium', from: 2500, to: 5000 },
                    { key: 'luxury', from: 5000 }
                ]
            }
        },
        emergency_available: {
            terms: { field: 'emergencyAvailable' }
        }
    }
} as const;

/**
 * Kenya-specific search configurations
 */
export const KENYA_SEARCH_CONFIG = {
    // Major cities for location-based searches
    majorCities: [
        'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret',
        'Thika', 'Malindi', 'Kitale', 'Garissa', 'Kakamega'
    ],

    // Counties for administrative searches
    counties: [
        'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet',
        'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado',
        'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga',
        'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia',
        'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
        'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
        'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
        'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
        'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu',
        'Vihiga', 'Wajir', 'West Pokot'
    ],

    // Common property features in Kenya
    commonFeatures: [
        'Borehole', 'Generator', 'Security', 'Parking', 'Garden',
        'Swimming Pool', 'Gym', 'Elevator', 'Balcony', 'Terrace',
        'Servant Quarter', 'Study Room', 'Dining Room', 'Store',
        'Laundry Area', 'CCTV', 'Electric Fence', 'Gate',
        'Caretaker', 'Water Tank'
    ],

    // Common contractor specialties
    contractorSpecialties: [
        'Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Painting',
        'Roofing', 'Flooring', 'Appliance Repair', 'Pest Control',
        'Landscaping', 'Cleaning', 'General Maintenance', 'Masonry',
        'Tiling', 'Welding', 'Solar Installation', 'Water Drilling'
    ]
} as const;

/**
 * Search query templates
 */
export const SEARCH_TEMPLATES = {
    // Basic text search
    textSearch: {
        multi_match: {
            query: '{{query}}',
            fields: '{{fields}}',
            type: 'best_fields',
            fuzziness: SEARCH_CONFIG.elasticsearch.fuzziness
        }
    },

    // Geo distance search
    geoDistanceSearch: {
        geo_distance: {
            distance: '{{distance}}',
            '{{field}}': {
                lat: '{{lat}}',
                lon: '{{lon}}'
            }
        }
    },

    // Range filters
    priceRangeFilter: {
        range: {
            '{{field}}': {
                gte: '{{min}}',
                lte: '{{max}}'
            }
        }
    },

    // Terms filter
    termsFilter: {
        terms: {
            '{{field}}': '{{values}}'
        }
    }
} as const;

export type SearchEntityType = 'properties' | 'contractors';
export type SortOrder = 'asc' | 'desc';
export type SearchSource = 'web' | 'mobile' | 'api';