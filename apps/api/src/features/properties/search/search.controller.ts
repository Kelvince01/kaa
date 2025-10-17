import { Property, SavedSearch } from "@kaa/models";
import type { IProperty } from "@kaa/models/types";
import { Elysia, t } from "elysia";
import type { FilterQuery } from "mongoose";
import { authPlugin } from "~/features/auth/auth.plugin";

/**
 * Property search functionality and saved searches
 */
export const searchController = new Elysia({
  detail: {
    tags: ["search"],
  },
}).group("/search", (app) =>
  app
    .get(
      "/",
      async ({ set, query }) => {
        try {
          const {
            location,
            propertyType,
            minPrice,
            maxPrice,
            bedrooms,
            bathrooms,
            furnished,
            petsAllowed,
            availableFrom,
            features,
            radius,
            latitude,
            longitude,
            sortBy = "createdAt",
            sortOrder = "desc",
            createdAt,
            page = 1,
            limit = 10,
          } = query;

          // Parse pagination parameters
          const pageNum = page || 1;
          const limitNum = limit || 10;
          const skip = (pageNum - 1) * limitNum;

          // Build filter query
          const filter: FilterQuery<IProperty> = { available: true };

          // Property type filter
          if (propertyType) {
            filter.type = propertyType;
          }

          // Price range filter
          if (minPrice || maxPrice) {
            filter.pricing.rentAmount = {};
            if (minPrice) {
              (filter.pricing.rentAmount as Record<string, number>).$gte =
                minPrice;
            }
            if (maxPrice) {
              (filter.pricing.rentAmount as Record<string, number>).$lte =
                maxPrice;
            }
          }

          // Bedrooms filter
          if (bedrooms) {
            filter.details.bedrooms = bedrooms;
          }

          // Bathrooms filter
          if (bathrooms) {
            filter.details.bathrooms = bathrooms;
          }

          // Furnished status filter
          if (furnished) {
            filter.details.furnished = furnished === true;
          }

          // Pets allowed filter
          if (petsAllowed) {
            filter.details.petsAllowed = petsAllowed === true;
          }

          // Available from date filter
          if (availableFrom) {
            const date = new Date(availableFrom as string);
            if (!Number.isNaN(date.getTime())) {
              filter.availableFrom = { $lte: date };
            }
          }

          // Features filter (array of amenities)
          if (features) {
            filter.features = { $all: features };
          }

          // Geo-based search within radius
          if (latitude && longitude && radius) {
            const lat = latitude;
            const lng = longitude;
            const radiusInMeters = radius * 1000; // Convert km to meters

            // Use MongoDB's geospatial query
            filter.geolocation = {
              $nearSphere: {
                $geometry: {
                  type: "Point",
                  coordinates: [lng, lat], // MongoDB uses [longitude, latitude] order
                },
                $maxDistance: radiusInMeters,
              },
            };
          } else if (location) {
            // Text-based location search
            filter.$or = [
              { "location.address.city": { $regex: location, $options: "i" } },
              { "location.address.state": { $regex: location, $options: "i" } },
              {
                "location.address.postalCode": {
                  $regex: location,
                  $options: "i",
                },
              },
              { "location.address.town": { $regex: location, $options: "i" } },
            ];
          }

          // Build sort
          const sort: Record<string, 1 | -1> = {};
          sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

          // Execute search query with pagination
          const properties = await Property.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .populate("landlord", "firstName lastName avatar email phone")
            .lean();

          // Get total count for pagination
          const totalProperties = await Property.countDocuments(filter);
          const totalPages = Math.ceil(totalProperties / limitNum);

          set.status = 200;
          return {
            status: "success",
            properties,
            pagination: {
              total: totalProperties,
              pages: totalPages,
              page: pageNum,
              limit: limitNum,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Internal server error",
          };
        }
      },
      {
        query: t.Object({
          location: t.Optional(t.String()),
          propertyType: t.Optional(t.String()),
          minPrice: t.Optional(t.Number()),
          maxPrice: t.Optional(t.Number()),
          bedrooms: t.Optional(t.Number()),
          bathrooms: t.Optional(t.Number()),
          furnished: t.Optional(t.Boolean()),
          petsAllowed: t.Optional(t.Boolean()),
          availableFrom: t.Optional(t.String()),
          features: t.Optional(t.Array(t.String())),
          radius: t.Optional(t.Number()),
          latitude: t.Optional(t.Number()),
          longitude: t.Optional(t.Number()),
          sortBy: t.Optional(t.String()),
          sortOrder: t.Optional(t.String()),
          createdAt: t.Optional(t.Date()),
          page: t.Optional(t.Number()),
          limit: t.Optional(t.Number()),
        }),
        detail: {
          tags: ["search"],
          summary: "Advanced search for properties",
        },
      }
    )
    .get(
      "/:propertyId/similar",
      async ({ set, params, query }) => {
        try {
          const { propertyId } = params;
          const { limit = 4 } = query;
          const limitNum = Number(limit) || 4;

          // Find the reference property
          const referenceProperty = await Property.findById(propertyId);

          if (!referenceProperty) {
            set.status = 404;
            return {
              status: "error",
              message: "Property not found",
            };
          }

          const {
            pricing,
            title,
            specifications,
            type,
            geolocation,
            location,
          } = referenceProperty;

          const priceRange = {
            $gte: pricing.rent * 0.8,
            $lte: pricing.rent * 1.2,
          };
          const bedroomsRange = {
            $gte: Math.max(1, (specifications?.bedrooms || 0) - 1),
            $lte: (specifications?.bedrooms || 0) + 1,
          };

          const filter: FilterQuery<IProperty> = {
            _id: { $ne: propertyId },
            available: true,
            type,
            specifications: { bedrooms: bedroomsRange },
            pricing: {
              rent: priceRange,
            },
          };

          if (
            geolocation?.coordinates &&
            geolocation.coordinates.length === 2
          ) {
            filter.geolocation = {
              $nearSphere: {
                $geometry: {
                  type: "Point",
                  coordinates: geolocation.coordinates,
                },
                $maxDistance: 5000,
              },
            };
          } else if (location) {
            const loc = location.address.town;
            filter.$or = [
              { "location.address.town": { $regex: loc, $options: "i" } },
              { location: { $regex: loc, $options: "i" } },
            ];
          }

          const similarProperties = await Property.find(filter)
            .limit(limitNum)
            .select("_id title description pricing location details type media")
            .lean();

          set.status = 200;
          return {
            status: "success",
            data: {
              properties: similarProperties,
              total: similarProperties.length,
              referenceProperty: {
                _id: referenceProperty._id,
                title: referenceProperty.title,
                price: referenceProperty.pricing.rent,
              },
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Error fetching similar properties",
          };
        }
      },
      {
        params: t.Object({
          propertyId: t.String(),
        }),
        query: t.Object({
          limit: t.Optional(t.Number()),
        }),
        detail: {
          tags: ["search"],
          summary: "Get similar properties",
        },
      }
    )
    .use(authPlugin)
    .post(
      "/save",
      async ({ set, body, user }) => {
        try {
          const { name, searchParams, emailNotifications, alertFrequency } =
            body;

          const savedSearch = new SavedSearch({
            user: user.id,
            name,
            searchParams,
            emailAlerts: emailNotifications,
            alertFrequency: alertFrequency || "daily",
          });

          await savedSearch.save();

          set.status = 201;
          return {
            status: "success",
            message: "Search saved successfully",
            savedSearch: {
              _id: savedSearch._id,
              name: savedSearch.name,
              searchParams: savedSearch.searchParams,
              emailAlerts: savedSearch.emailAlerts,
              alertFrequency: savedSearch.alertFrequency,
              createdAt: savedSearch.createdAt,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Internal server error",
          };
        }
      },
      {
        body: t.Object({
          name: t.String(),
          searchParams: t.Object({}),
          emailNotifications: t.Optional(t.Boolean()),
          alertFrequency: t.Optional(t.String()),
        }),
        detail: {
          tags: ["search"],
          summary: "Save a search",
          security: [
            {
              bearerAuth: [],
            },
          ],
        },
      }
    )
    .get(
      "/saved",
      async ({ set, user, query }) => {
        try {
          const userId = user.id;
          const page = Number(query.page) || 1;
          const limit = Number(query.limit) || 10;
          const skip = (page - 1) * limit;

          const savedSearches = await SavedSearch.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

          const totalSearches = await SavedSearch.countDocuments({
            user: userId,
          });
          const totalPages = Math.ceil(totalSearches / limit);

          const savedSearchesWithCounts = await Promise.all(
            savedSearches.map(async (search) => {
              const filter = buildFilterFromSearchParams(search.searchParams);
              const matchCount = await Property.countDocuments(filter);
              return {
                _id: search._id,
                name: search.name,
                searchParams: search.searchParams,
                emailAlerts: search.emailAlerts,
                alertFrequency: search.alertFrequency,
                createdAt: search.createdAt,
                matchCount,
              };
            })
          );

          set.status = 200;
          return {
            status: "success",
            data: {
              savedSearches: savedSearchesWithCounts,
              totalSearches,
              totalPages,
              currentPage: page,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Internal server error",
          };
        }
      },
      {
        query: t.Object({
          page: t.Optional(t.Number()),
          limit: t.Optional(t.Number()),
        }),
        detail: {
          tags: ["search"],
          summary: "Get saved searches",
          security: [
            {
              bearerAuth: [],
            },
          ],
        },
      }
    )
    .get(
      "/saved/:searchId",
      async ({ set, user, params }) => {
        try {
          const userId = user.id;

          const { searchId } = params;

          const savedSearch = await SavedSearch.findById(searchId);

          if (!savedSearch) {
            set.status = 404;
            return {
              status: "error",
              message: "Saved search not found",
            };
          }

          if (savedSearch.user.toString() !== userId) {
            set.status = 403;
            return {
              status: "error",
              message: "Not authorized to access this saved search",
            };
          }

          const filter = buildFilterFromSearchParams(savedSearch.searchParams);
          const matchingProperties = await Property.find(filter)
            .limit(5)
            .select("_id title pricing specifications location media")
            .lean();

          const formattedProperties = matchingProperties.map((property) => ({
            _id: property._id,
            title: property.title,
            price: property.pricing.rent,
            bedrooms: property.specifications.bedrooms,
            location: property.location,
            thumbnail: property.media.images?.[0].url || "",
          }));

          set.status = 200;
          return {
            status: "success",
            savedSearch: {
              _id: savedSearch._id,
              user: savedSearch.user,
              name: savedSearch.name,
              searchParams: savedSearch.searchParams,
              emailAlerts: savedSearch.emailAlerts,
              alertFrequency: savedSearch.alertFrequency,
              createdAt: savedSearch.createdAt,
              updatedAt: savedSearch.updatedAt,
              matchingProperties: formattedProperties,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Internal server error",
          };
        }
      },
      {
        params: t.Object({
          searchId: t.String(),
        }),
        detail: {
          tags: ["search"],
          summary: "Get saved search by ID",
          security: [
            {
              bearerAuth: [],
            },
          ],
        },
      }
    )
    .put(
      "/saved/:searchId",
      async ({ set, user, params, body }) => {
        try {
          const userId = user.id;

          const { searchId } = params;
          const { name, searchParams, emailAlerts, alertFrequency } = body;

          const savedSearch = await SavedSearch.findById(searchId);

          if (!savedSearch) {
            set.status = 404;
            return {
              status: "error",
              message: "Saved search not found",
            };
          }

          if (savedSearch.user.toString() !== userId) {
            set.status = 403;
            return {
              status: "error",
              message: "Not authorized to update this saved search",
            };
          }

          if (name) savedSearch.name = name;
          if (searchParams) savedSearch.searchParams = searchParams;
          if (emailAlerts !== undefined) savedSearch.emailAlerts = emailAlerts;
          if (alertFrequency) savedSearch.alertFrequency = alertFrequency;

          await savedSearch.save();

          set.status = 200;
          return {
            status: "success",
            message: "Search updated successfully",
            savedSearch: {
              _id: savedSearch._id,
              name: savedSearch.name,
              searchParams: savedSearch.searchParams,
              emailAlerts: savedSearch.emailAlerts,
              alertFrequency: savedSearch.alertFrequency,
              updatedAt: savedSearch.updatedAt,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Internal server error",
          };
        }
      },
      {
        body: t.Object({
          name: t.String(),
          searchParams: t.Object({}),
          emailAlerts: t.Optional(t.Boolean()),
          alertFrequency: t.Optional(
            t.Enum({ DAILY: "daily", WEEKLY: "weekly", INSTANT: "instant" })
          ),
        }),
        detail: {
          tags: ["search"],
          summary: "Update saved search by ID",
          security: [
            {
              bearerAuth: [],
            },
          ],
        },
      }
    )
    .delete(
      "/saved/:searchId",
      async ({ set, user, params }) => {
        try {
          const userId = user.id;

          const { searchId } = params;
          const savedSearch = await SavedSearch.findById(searchId);

          if (!savedSearch) {
            set.status = 404;
            return {
              status: "error",
              message: "Saved search not found",
            };
          }

          if (savedSearch.user.toString() !== userId.toString()) {
            set.status = 403;
            return {
              status: "error",
              message: "Not authorized to delete this saved search",
            };
          }

          await SavedSearch.findByIdAndDelete(searchId);

          set.status = 200;
          return {
            status: "success",
            message: "Saved search deleted successfully",
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Internal server error",
          };
        }
      },
      {
        params: t.Object({
          searchId: t.String(),
        }),
        detail: {
          tags: ["search"],
          summary: "Delete saved search by ID",
          security: [
            {
              bearerAuth: [],
            },
          ],
        },
      }
    )
    .patch(
      "/alerts/toggle/:searchId",
      async ({ set, user, params, body }) => {
        try {
          const userId = user.id;

          const { searchId } = params;
          const { emailAlerts, alertFrequency } = body;

          if (emailAlerts && !alertFrequency) {
            set.status = 400;
            return {
              status: "error",
              message:
                "Alert frequency is required when email alerts are enabled",
            };
          }

          const savedSearch = await SavedSearch.findById(searchId);

          if (!savedSearch) {
            set.status = 404;
            return {
              status: "error",
              message: "Saved search not found",
            };
          }

          if (savedSearch.user.toString() !== userId) {
            set.status = 403;
            return {
              status: "error",
              message: "Not authorized to update this saved search",
            };
          }

          savedSearch.emailAlerts = emailAlerts;
          if (alertFrequency) {
            savedSearch.alertFrequency = alertFrequency;
          }

          await savedSearch.save();

          const statusMessage = emailAlerts
            ? `Email alerts enabled for this search (${alertFrequency})`
            : "Email alerts disabled for this search";

          set.status = 200;
          return {
            status: "success",
            message: statusMessage,
            savedSearch: {
              _id: savedSearch._id,
              emailAlerts: savedSearch.emailAlerts,
              alertFrequency: savedSearch.alertFrequency,
            },
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: "Internal server error",
          };
        }
      },
      {
        body: t.Object({
          emailAlerts: t.Boolean(),
          alertFrequency: t.Optional(
            t.Enum({ DAILY: "daily", WEEKLY: "weekly", INSTANT: "instant" })
          ),
        }),
        detail: {
          tags: ["search"],
          summary: "Toggle email alerts for a saved search",
          security: [
            {
              bearerAuth: [],
            },
          ],
        },
      }
    )
);

/**
 * Helper function to build a MongoDB filter from search parameters
 * @param searchParams - Search parameters object
 * @returns MongoDB filter object
 */
const buildFilterFromSearchParams = (
  searchParams: Record<string, unknown>
): Record<string, unknown> => {
  const filter: FilterQuery<IProperty> = { available: true };

  // Property type filter
  if (searchParams.propertyType) {
    filter.type = searchParams.propertyType;
  }

  // Price range filter
  if (searchParams.minPrice || searchParams.maxPrice) {
    filter.pricing.rent = {};
    if (searchParams.minPrice) {
      (filter.pricing.rent as Record<string, number>).$gte = Number(
        searchParams.minPrice
      );
    }
    if (searchParams.maxPrice) {
      (filter.pricing.rent as Record<string, number>).$lte = Number(
        searchParams.maxPrice
      );
    }
  }

  // Bedrooms filter
  if (searchParams.bedrooms) {
    filter.specifications.bedrooms = Array.isArray(searchParams.bedrooms)
      ? { $in: searchParams.bedrooms }
      : searchParams.bedrooms;
  }

  // Bathrooms filter
  if (searchParams.bathrooms) {
    filter.specifications.bathrooms = searchParams.bathrooms;
  }

  // Furnished status filter
  if (searchParams.furnished) {
    filter.rules.furnished =
      searchParams.furnished === "true" || searchParams.furnished === true;
  }

  // Pets allowed filter
  if (searchParams.petsAllowed) {
    filter.rules.petsAllowed =
      searchParams.petsAllowed === "true" || searchParams.petsAllowed === true;
  }

  // Available from date filter
  if (searchParams.availableFrom) {
    const date = new Date(searchParams.availableFrom as string);
    if (!Number.isNaN(date.getTime())) {
      filter.availableFrom = { $lte: date };
    }
  }

  // Features filter (array of amenities)
  if (searchParams.features) {
    const featuresList = Array.isArray(searchParams.features)
      ? searchParams.features
      : [searchParams.features];
    filter.features = { $all: featuresList };
  }

  // Geo-based search within radius
  if (searchParams.latitude && searchParams.longitude && searchParams.radius) {
    const lat = Number(searchParams.latitude);
    const lng = Number(searchParams.longitude);
    const radiusInMeters = Number(searchParams.radius) * 1000; // Convert km to meters

    // Use MongoDB's geospatial query
    filter.geolocation = {
      $nearSphere: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat], // MongoDB uses [longitude, latitude] order
        },
        $maxDistance: radiusInMeters,
      },
    };
  } else if (searchParams.location) {
    // Text-based location search
    filter.$or = [
      {
        "location.address.town": {
          $regex: searchParams.location,
          $options: "i",
        },
      },
      { "location.county": { $regex: searchParams.location, $options: "i" } },
      {
        "location.address.postalCode": {
          $regex: searchParams.location,
          $options: "i",
        },
      },
      { location: { $regex: searchParams.location, $options: "i" } },
    ];
  }

  return filter;
};
