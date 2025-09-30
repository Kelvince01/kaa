import { AmenityCategory, KenyanCounty, LocationType } from "@kaa/models/types";
import { z } from "zod";

export const AmenitySchema = z.object({
  name: z.string(),
  category: z.enum(Object.values(AmenityCategory)),
  type: z.string(),
  coordinates: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
  distance: z.number().optional(),
  rating: z.number().optional(),
  isVerified: z.boolean(),
  contact: z
    .object({
      phone: z.string().optional(),
      email: z.email().optional(),
      website: z.string().optional(),
    })
    .optional(),
  hours: z
    .array(
      z.object({
        monday: z.array(
          z.object({
            open: z.iso.datetime(),
            close: z.iso.datetime(),
          })
        ),
        tuesday: z.array(
          z.object({
            open: z.iso.datetime(),
            close: z.iso.datetime(),
          })
        ),
        wednesday: z.array(
          z.object({
            open: z.iso.datetime(),
            close: z.iso.datetime(),
          })
        ),
        thursday: z.array(
          z.object({
            open: z.iso.datetime(),
            close: z.iso.datetime(),
          })
        ),
        friday: z.array(
          z.object({
            open: z.iso.datetime(),
            close: z.iso.datetime(),
          })
        ),
        saturday: z.array(
          z.object({
            open: z.iso.datetime(),
            close: z.iso.datetime(),
          })
        ),
        sunday: z.array(
          z.object({
            open: z.iso.datetime(),
            close: z.iso.datetime(),
          })
        ),
      })
    )
    .optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const LocationAddressSchema = z.object({
  street: z.string().optional(),
  building: z.string().optional(),
  estate: z.string().optional(),
  suburb: z.string().optional(),
  ward: z.string().optional(),
  constituency: z.string().optional(),
  county: z.enum(Object.values(KenyanCounty)),
  postalCode: z.string().optional(),
  country: z.string().min(1),
  formatted: z.string().min(1),
});

export const LocationMetadataSchema = z.object({
  population: z.number().optional(),
  elevation: z.number().optional(),
  timeZone: z.string(),
  languages: z.array(z.string()),
  currency: z.string(),
  dialCode: z.string(),
  alternativeNames: z.array(z.string()),
  historicalNames: z.array(z.string()),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  images: z
    .array(
      z.object({
        url: z.string(),
        type: z.enum(["primary", "gallery", "map", "aerial"]),
        caption: z.string().optional(),
        uploadedAt: z.date(),
        uploadedBy: z.string().optional(),
      })
    )
    .optional(),
  documents: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
        type: z.enum(["deed", "survey", "planning", "other"]),
        uploadedAt: z.date(),
        uploadedBy: z.string().optional(),
      })
    )
    .optional(),
});

export const DemographicsSchema = z.object({
  population: z.number().min(1),
  households: z.number(),
  averageAge: z.number(),
  literacy: z.number(),
  employment: z.number(),
  lastUpdated: z.date(),
  source: z.string(),
});

export const TransportationSchema = z.object({
  publicTransport: z.array(
    z.object({
      type: z.enum(["bus", "matatu", "boda", "taxi", "train"]),
      routes: z.array(z.string()),
      frequency: z.enum(["high", "medium", "low"]),
      cost: z.object({
        min: z.number(),
        max: z.number(),
        currency: z.string(),
      }),
    })
  ),
  roads: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["highway", "arterial", "collector", "local"]),
      surface: z.enum(["tarmac", "murram", "dirt"]),
      condition: z.enum(["excellent", "good", "fair", "poor"]),
    })
  ),
  airports: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["airport", "airstrip"]),
      distance: z.number(),
      coordinates: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
    })
  ),
  trainStations: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["train", "railway"]),
      distance: z.number(),
      coordinates: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
    })
  ),
  busStations: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["bus", "bus_stop"]),
      distance: z.number(),
      coordinates: z.object({
        latitude: z.number(),
        longitude: z.number(),
      }),
    })
  ),
  matatu: z.object({
    routes: z.array(z.string()),
    stages: z.array(
      z.object({
        name: z.string(),
        distance: z.number(),
        coordinates: z.object({
          latitude: z.number(),
          longitude: z.number(),
        }),
      })
    ),
  }),
});

export const LocationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(Object.values(LocationType)),
  description: z.string().optional(),
  county: z.enum(Object.values(KenyanCounty)),
  parent: z.string().optional(),
  address: LocationAddressSchema.optional(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  tags: z.array(z.string()).optional(),
  amenities: AmenitySchema.array().optional(),
  metadata: LocationMetadataSchema.optional(),
});

export const LocationSearchSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1),
});
