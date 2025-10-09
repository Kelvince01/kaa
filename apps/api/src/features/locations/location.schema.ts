import { AmenityCategory, KenyanCounty, LocationType } from "@kaa/models/types";
import { t } from "elysia";

/**
 * Helper function to create Elysia enum from enum values
 */
const createEnumFromValues = (values: string[]) =>
  Object.fromEntries(values.map((v) => [v, v]));

export const AmenitySchema = t.Object({
  name: t.String(),
  category: t.Enum(createEnumFromValues(Object.values(AmenityCategory))),
  type: t.String(),
  coordinates: t.Optional(
    t.Object({
      latitude: t.Number(),
      longitude: t.Number(),
    })
  ),
  distance: t.Optional(t.Number()),
  rating: t.Optional(t.Number()),
  isVerified: t.Boolean(),
  contact: t.Optional(
    t.Object({
      phone: t.Optional(t.String()),
      email: t.Optional(t.String()),
      website: t.Optional(t.String()),
    })
  ),
  hours: t.Optional(
    t.Array(
      t.Object({
        monday: t.Array(
          t.Object({
            open: t.Date(),
            close: t.Date(),
          })
        ),
        tuesday: t.Array(
          t.Object({
            open: t.Date(),
            close: t.Date(),
          })
        ),
        wednesday: t.Array(
          t.Object({
            open: t.Date(),
            close: t.Date(),
          })
        ),
        thursday: t.Array(
          t.Object({
            open: t.Date(),
            close: t.Date(),
          })
        ),
        friday: t.Array(
          t.Object({
            open: t.Date(),
            close: t.Date(),
          })
        ),
        saturday: t.Array(
          t.Object({
            open: t.Date(),
            close: t.Date(),
          })
        ),
        sunday: t.Array(
          t.Object({
            open: t.Date(),
            close: t.Date(),
          })
        ),
      })
    )
  ),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
});

export const LocationAddressSchema = t.Object({
  street: t.Optional(t.String()),
  building: t.Optional(t.String()),
  estate: t.Optional(t.String()),
  suburb: t.Optional(t.String()),
  ward: t.Optional(t.String()),
  constituency: t.Optional(t.String()),
  county: t.Enum(createEnumFromValues(Object.values(KenyanCounty))),
  postalCode: t.Optional(t.String()),
  country: t.String({ minLength: 1 }),
  formatted: t.String({ minLength: 1 }),
});

export const LocationMetadataSchema = t.Object({
  population: t.Optional(t.Number()),
  elevation: t.Optional(t.Number()),
  timeZone: t.String(),
  languages: t.Array(t.String()),
  currency: t.String(),
  dialCode: t.String(),
  alternativeNames: t.Array(t.String()),
  historicalNames: t.Array(t.String()),
  description: t.Optional(t.String()),
  tags: t.Optional(t.Array(t.String())),
  images: t.Optional(
    t.Array(
      t.Object({
        url: t.String(),
        type: t.Enum({
          primary: "primary",
          gallery: "gallery",
          map: "map",
          aerial: "aerial",
        }),
        caption: t.Optional(t.String()),
        uploadedAt: t.Date(),
        uploadedBy: t.Optional(t.String()),
      })
    )
  ),
  documents: t.Optional(
    t.Array(
      t.Object({
        name: t.String(),
        url: t.String(),
        type: t.Enum({
          deed: "deed",
          survey: "survey",
          planning: "planning",
          other: "other",
        }),
        uploadedAt: t.Date(),
        uploadedBy: t.Optional(t.String()),
      })
    )
  ),
});

export const DemographicsSchema = t.Object({
  population: t.Number({ minimum: 1 }),
  households: t.Number(),
  averageAge: t.Number(),
  literacy: t.Number(),
  employment: t.Number(),
  lastUpdated: t.Date(),
  source: t.String(),
});

export const TransportationSchema = t.Object({
  publicTransport: t.Array(
    t.Object({
      type: t.Enum({
        bus: "bus",
        matatu: "matatu",
        boda: "boda",
        taxi: "taxi",
        train: "train",
      }),
      routes: t.Array(t.String()),
      frequency: t.Enum({
        high: "high",
        medium: "medium",
        low: "low",
      }),
      cost: t.Object({
        min: t.Number(),
        max: t.Number(),
        currency: t.String(),
      }),
    })
  ),
  roads: t.Array(
    t.Object({
      name: t.String(),
      type: t.Enum({
        highway: "highway",
        arterial: "arterial",
        collector: "collector",
        local: "local",
      }),
      surface: t.Enum({
        tarmac: "tarmac",
        murram: "murram",
        dirt: "dirt",
      }),
      condition: t.Enum({
        excellent: "excellent",
        good: "good",
        fair: "fair",
        poor: "poor",
      }),
    })
  ),
  airports: t.Array(
    t.Object({
      name: t.String(),
      type: t.Enum({
        airport: "airport",
        airstrip: "airstrip",
      }),
      distance: t.Number(),
      coordinates: t.Object({
        latitude: t.Number(),
        longitude: t.Number(),
      }),
    })
  ),
  trainStations: t.Array(
    t.Object({
      name: t.String(),
      type: t.Enum({
        train: "train",
        railway: "railway",
      }),
      distance: t.Number(),
      coordinates: t.Object({
        latitude: t.Number(),
        longitude: t.Number(),
      }),
    })
  ),
  busStations: t.Array(
    t.Object({
      name: t.String(),
      type: t.Enum({
        bus: "bus",
        bus_stop: "bus_stop",
      }),
      distance: t.Number(),
      coordinates: t.Object({
        latitude: t.Number(),
        longitude: t.Number(),
      }),
    })
  ),
  matatu: t.Object({
    routes: t.Array(t.String()),
    stages: t.Array(
      t.Object({
        name: t.String(),
        distance: t.Number(),
        coordinates: t.Object({
          latitude: t.Number(),
          longitude: t.Number(),
        }),
      })
    ),
  }),
});

export const LocationSchema = t.Object({
  name: t.String({ minLength: 1 }),
  type: t.Enum(createEnumFromValues(Object.values(LocationType))),
  description: t.Optional(t.String()),
  county: t.Enum(createEnumFromValues(Object.values(KenyanCounty))),
  parent: t.Optional(t.String()),
  address: t.Optional(LocationAddressSchema),
  coordinates: t.Object({
    latitude: t.Number(),
    longitude: t.Number(),
  }),
  tags: t.Optional(t.Array(t.String())),
  amenities: t.Optional(t.Array(AmenitySchema)),
  metadata: t.Optional(LocationMetadataSchema),
});

export const LocationSearchSchema = t.Object({
  query: t.String({ minLength: 1 }),
  limit: t.Number({ minimum: 1 }),
});
