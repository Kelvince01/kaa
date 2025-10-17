import {
  AmenityApprovalStatus,
  AmenityCategory,
  AmenitySource,
  AmenityType,
  type IAmenity,
} from "@kaa/models/types";
import { AmenityService } from "@kaa/services";
import { logger } from "@kaa/utils";

/**
 * Seed data for common Kenyan amenities
 * Focused on Nairobi and major urban centers
 */
export const kenyanAmenitiesSeedData: Partial<IAmenity>[] = [
  // Education - Nairobi
  {
    name: "University of Nairobi",
    type: AmenityType.UNIVERSITY,
    category: AmenityCategory.EDUCATION,
    description: "Premier public university in Kenya",
    location: {
      country: "Kenya",
      county: "Nairobi",
      constituency: "Starehe",
      ward: "Landhies",
      estate: "University Way",
      address: {
        line1: "University Way",
        town: "Nairobi",
        postalCode: "00100",
      },
      coordinates: {
        latitude: -1.2793,
        longitude: 36.8155,
      },
    },
    geolocation: {
      type: "Point",
      coordinates: [-1.2793, 36.8155],
    },
    contact: {
      phone: "+254-20-4491000",
      email: "info@uonbi.ac.ke",
      website: "https://www.uonbi.ac.ke",
    },
    source: AmenitySource.BULK_IMPORT,
    isAutoDiscovered: false,
    approvalStatus: AmenityApprovalStatus.APPROVED,
    verificationLevel: "full",
    verified: true,
    tags: ["public", "higher education", "research"],
  },
  {
    name: "Nairobi Primary School",
    type: AmenityType.PRIMARY_SCHOOL,
    category: AmenityCategory.EDUCATION,
    location: {
      country: "Kenya",
      county: "Nairobi",
      constituency: "Starehe",
      ward: "Landhies",
      estate: "CBD",
      address: {
        line1: "Tom Mboya Street",
        town: "Nairobi",
        postalCode: "00100",
      },
      coordinates: {
        latitude: -1.2841,
        longitude: 36.8155,
      },
    },
    geolocation: {
      type: "Point",
      coordinates: [-1.2841, 36.8155],
    },
    source: AmenitySource.BULK_IMPORT,
    approvalStatus: AmenityApprovalStatus.APPROVED,
    verified: true,
    tags: ["public", "primary education"],
  },

  // Healthcare - Nairobi
  {
    name: "Kenyatta National Hospital",
    type: AmenityType.HOSPITAL,
    category: AmenityCategory.HEALTHCARE,
    description: "Kenya's largest referral and teaching hospital",
    location: {
      country: "Kenya",
      county: "Nairobi",
      constituency: "Lang'ata",
      ward: "Mugumo-ini",
      estate: "Upper Hill",
      address: {
        line1: "Hospital Road",
        town: "Nairobi",
        postalCode: "00202",
      },
      coordinates: {
        latitude: -1.3018,
        longitude: 36.807,
      },
    },
    geolocation: {
      type: "Point",
      coordinates: [-1.3018, 36.807],
    },
    contact: {
      phone: "+254-20-2726300",
      website: "https://knh.or.ke",
    },
    operatingHours: {
      monday: [{ open: "00:00", close: "24:00" }],
      tuesday: [{ open: "00:00", close: "24:00" }],
      wednesday: [{ open: "00:00", close: "24:00" }],
      thursday: [{ open: "00:00", close: "24:00" }],
      friday: [{ open: "00:00", close: "24:00" }],
      saturday: [{ open: "00:00", close: "24:00" }],
      sunday: [{ open: "00:00", close: "24:00" }],
    },
    source: AmenitySource.BULK_IMPORT,
    approvalStatus: AmenityApprovalStatus.APPROVED,
    verified: true,
    rating: 4.2,
    reviewCount: 150,
    tags: ["public", "referral", "emergency"],
  },
  {
    name: "Nairobi Hospital",
    type: AmenityType.HOSPITAL,
    category: AmenityCategory.HEALTHCARE,
    description: "Leading private hospital in East Africa",
    location: {
      country: "Kenya",
      county: "Nairobi",
      constituency: "Lang'ata",
      ward: "Mugumo-ini",
      estate: "Upper Hill",
      address: {
        line1: "Argwings Kodhek Road",
        town: "Nairobi",
        postalCode: "00202",
      },
      coordinates: {
        latitude: -1.3032,
        longitude: 36.8089,
      },
    },
    geolocation: {
      type: "Point",
      coordinates: [-1.3032, 36.8089],
    },
    contact: {
      phone: "+254-20-2845000",
      website: "https://www.nairobihospital.org",
    },
    source: AmenitySource.BULK_IMPORT,
    approvalStatus: AmenityApprovalStatus.APPROVED,
    verified: true,
    rating: 4.5,
    reviewCount: 200,
    tags: ["private", "specialized care"],
  },

  // Shopping - Nairobi
  {
    name: "Westgate Shopping Mall",
    type: AmenityType.SHOPPING_MALL,
    category: AmenityCategory.SHOPPING,
    description: "Modern shopping mall in Westlands",
    location: {
      country: "Kenya",
      county: "Nairobi",
      constituency: "Westlands",
      ward: "Kitisuru",
      estate: "Westlands",
      address: {
        line1: "Mwanzi Road",
        town: "Nairobi",
        postalCode: "00600",
      },
      coordinates: {
        latitude: -1.2667,
        longitude: 36.8056,
      },
    },
    geolocation: {
      type: "Point",
      coordinates: [-1.2667, 36.8056],
    },
    contact: {
      phone: "+254-20-3746000",
      website: "https://www.westgate.co.ke",
    },
    operatingHours: {
      monday: [{ open: "10:00 AM", close: "10:00 PM" }],
      tuesday: [{ open: "10:00 AM", close: "10:00 PM" }],
      wednesday: [{ open: "10:00 AM", close: "10:00 PM" }],
      thursday: [{ open: "10:00 AM", close: "10:00 PM" }],
      friday: [{ open: "10:00 AM", close: "10:00 PM" }],
      saturday: [{ open: "10:00 AM", close: "10:00 PM" }],
      sunday: [{ open: "10:00 AM", close: "10:00 PM" }],
    },
    verified: true,
    rating: 4.3,
    reviewCount: 500,
    tags: ["shopping", "dining", "entertainment"],
  },
  {
    name: "Tuskys Supermarket",
    type: AmenityType.SUPERMARKET,
    category: AmenityCategory.SHOPPING,
    description: "Popular supermarket chain",
    location: {
      country: "Kenya",
      county: "Nairobi",
      constituency: "Starehe",
      ward: "Landhies",
      estate: "CBD",
      address: {
        line1: "Kimathi Street",
        town: "Nairobi",
        postalCode: "00100",
      },
      coordinates: {
        latitude: -1.2833,
        longitude: 36.8167,
      },
    },
    geolocation: {
      type: "Point",
      coordinates: [-1.2833, 36.8167],
    },
    operatingHours: {
      monday: [{ open: "8:00 AM", close: "9:00 PM" }],
      tuesday: [{ open: "8:00 AM", close: "9:00 PM" }],
      wednesday: [{ open: "8:00 AM", close: "9:00 PM" }],
      thursday: [{ open: "8:00 AM", close: "9:00 PM" }],
      friday: [{ open: "8:00 AM", close: "9:00 PM" }],
      saturday: [{ open: "8:00 AM", close: "9:00 PM" }],
      sunday: [{ open: "9:00 AM", close: "8:00 PM" }],
    },
    verified: true,
    rating: 4.0,
    reviewCount: 80,
    tags: ["groceries", "household items"],
  },

  // Transport - Nairobi
  {
    name: "Railways Bus Station",
    type: AmenityType.BUS_STOP,
    category: AmenityCategory.TRANSPORT,
    description: "Major bus terminal in Nairobi CBD",
    location: {
      country: "Kenya",
      county: "Nairobi",
      constituency: "Starehe",
      ward: "Landhies",
      estate: "CBD",
      address: {
        line1: "Haile Selassie Avenue",
        town: "Nairobi",
        postalCode: "00100",
      },
      coordinates: {
        latitude: -1.2921,
        longitude: 36.8219,
      },
    },
    geolocation: {
      type: "Point",
      coordinates: [-1.2921, 36.8219],
    },
    operatingHours: {
      monday: [{ open: "5:00 AM", close: "10:00 PM" }],
      tuesday: [{ open: "5:00 AM", close: "10:00 PM" }],
      wednesday: [{ open: "5:00 AM", close: "10:00 PM" }],
      thursday: [{ open: "5:00 AM", close: "10:00 PM" }],
      friday: [{ open: "5:00 AM", close: "10:00 PM" }],
      saturday: [{ open: "5:00 AM", close: "10:00 PM" }],
      sunday: [{ open: "6:00 AM", close: "9:00 PM" }],
    },
    verified: true,
    tags: ["public transport", "long distance"],
  },
  {
    name: "Westlands Matatu Stage",
    type: AmenityType.MATATU_STAGE,
    category: AmenityCategory.TRANSPORT,
    description: "Busy matatu stage serving Westlands area",
    location: {
      country: "Kenya",
      county: "Nairobi",
      constituency: "Westlands",
      ward: "Kitisuru",
      estate: "Westlands",
      address: {
        line1: "Waiyaki Way",
        town: "Nairobi",
        postalCode: "00600",
      },
      coordinates: {
        latitude: -1.263,
        longitude: 36.8063,
      },
    },
    geolocation: {
      type: "Point",
      coordinates: [-1.263, 36.8063],
    },
    operatingHours: {
      monday: [{ open: "5:00 AM", close: "11:00 PM" }],
      tuesday: [{ open: "5:00 AM", close: "11:00 PM" }],
      wednesday: [{ open: "5:00 AM", close: "11:00 PM" }],
      thursday: [{ open: "5:00 AM", close: "11:00 PM" }],
      friday: [{ open: "5:00 AM", close: "11:00 PM" }],
      saturday: [{ open: "5:00 AM", close: "11:00 PM" }],
      sunday: [{ open: "6:00 AM", close: "10:00 PM" }],
    },
    verified: true,
    tags: ["matatu", "public transport"],
  },

  // Banking - Nairobi
  {
    name: "KCB Bank - Kimathi Street",
    type: AmenityType.BANK,
    category: AmenityCategory.BANKING,
    description: "KCB Bank branch in CBD",
    location: {
      country: "Kenya",
      county: "Nairobi",
      constituency: "Starehe",
      ward: "Landhies",
      estate: "CBD",
      address: {
        line1: "Kimathi Street",
        town: "Nairobi",
        postalCode: "00100",
      },
      coordinates: {
        latitude: -1.2836,
        longitude: 36.8172,
      },
    },
    contact: {
      phone: "+254-711-087000",
      website: "https://kcbgroup.com",
    },
    geolocation: {
      type: "Point",
      coordinates: [-1.2836, 36.8172],
    },
    operatingHours: {
      monday: [{ open: "8:30 AM", close: "5:00 PM" }],
      tuesday: [{ open: "8:30 AM", close: "5:00 PM" }],
      wednesday: [{ open: "8:30 AM", close: "5:00 PM" }],
      thursday: [{ open: "8:30 AM", close: "5:00 PM" }],
      friday: [{ open: "8:30 AM", close: "5:00 PM" }],
      saturday: [{ open: "8:30 AM", close: "1:00 PM" }],
    },
    verified: true,
    rating: 4.1,
    tags: ["banking", "ATM", "loans"],
  },
  {
    name: "M-Pesa Agent - Westlands",
    type: AmenityType.MPESA_AGENT,
    category: AmenityCategory.BANKING,
    description: "M-Pesa money transfer agent",
    location: {
      country: "Kenya",
      county: "Nairobi",
      constituency: "Westlands",
      ward: "Kitisuru",
      estate: "Westlands",
      address: {
        line1: "Waiyaki Way",
        town: "Nairobi",
        postalCode: "00600",
      },
      coordinates: {
        latitude: -1.2635,
        longitude: 36.8058,
      },
    },
    geolocation: {
      type: "Point",
      coordinates: [-1.2635, 36.8058],
    },
    operatingHours: {
      monday: [{ open: "7:00 AM", close: "8:00 PM" }],
      tuesday: [{ open: "7:00 AM", close: "8:00 PM" }],
      wednesday: [{ open: "7:00 AM", close: "8:00 PM" }],
      thursday: [{ open: "7:00 AM", close: "8:00 PM" }],
      friday: [{ open: "7:00 AM", close: "8:00 PM" }],
      saturday: [{ open: "7:00 AM", close: "8:00 PM" }],
      sunday: [{ open: "8:00 AM", close: "6:00 PM" }],
    },
    verified: true,
    tags: ["mobile money", "cash transfer"],
  },

  // Religious - Nairobi
  {
    name: "All Saints Cathedral",
    type: AmenityType.CHURCH,
    category: AmenityCategory.RELIGIOUS,
    description: "Anglican cathedral in Nairobi",
    location: {
      country: "Kenya",
      county: "Nairobi",
      constituency: "Starehe",
      ward: "Landhies",
      estate: "CBD",
      address: {
        line1: "Kenyatta Avenue",
        town: "Nairobi",
        postalCode: "00100",
      },
      coordinates: {
        latitude: -1.2864,
        longitude: 36.8172,
      },
    },
    contact: {
      phone: "+254-20-2214755",
    },
    geolocation: {
      type: "Point",
      coordinates: [-1.2864, 36.8172],
    },
    operatingHours: {
      sunday: [
        {
          open: "7:00 AM",
          close: "12:00 PM",
        },
      ],
      wednesday: [
        {
          open: "6:00 PM",
          close: "8:00 PM",
        },
      ],
    },
    verified: true,
    tags: ["Anglican", "cathedral", "worship"],
  },

  // Government - Nairobi
  {
    name: "Central Police Station",
    type: AmenityType.POLICE_STATION,
    category: AmenityCategory.GOVERNMENT,
    description: "Main police station in Nairobi CBD",
    location: {
      country: "Kenya",
      county: "Nairobi",
      constituency: "Starehe",
      ward: "Landhies",
      estate: "CBD",
      address: {
        line1: "University Way",
        town: "Nairobi",
        postalCode: "00100",
      },
      coordinates: {
        latitude: -1.2853,
        longitude: 36.8172,
      },
    },
    contact: {
      phone: "+254-20-240000",
    },
    geolocation: {
      type: "Point",
      coordinates: [-1.2853, 36.8172],
    },
    operatingHours: {
      monday: [{ open: "00:00", close: "24:00" }],
      tuesday: [{ open: "00:00", close: "24:00" }],
      wednesday: [{ open: "00:00", close: "24:00" }],
      thursday: [{ open: "00:00", close: "24:00" }],
      friday: [{ open: "00:00", close: "24:00" }],
      saturday: [{ open: "00:00", close: "24:00" }],
      sunday: [{ open: "00:00", close: "24:00" }],
    },
    verified: true,
    tags: ["police", "emergency", "security"],
  },

  // Entertainment - Nairobi
  {
    name: "Uhuru Park",
    type: AmenityType.PARK,
    category: AmenityCategory.ENTERTAINMENT,
    description: "Large public park in central Nairobi",
    location: {
      country: "Kenya",
      county: "Nairobi",
      constituency: "Starehe",
      ward: "Landhies",
      estate: "CBD",
      address: {
        line1: "Uhuru Highway",
        town: "Nairobi",
        postalCode: "00100",
      },
      coordinates: {
        latitude: -1.294,
        longitude: 36.8047,
      },
    },
    geolocation: {
      type: "Point",
      coordinates: [-1.294, 36.8047],
    },
    operatingHours: {
      monday: [{ open: "6:00 AM", close: "6:00 PM" }],
      tuesday: [{ open: "6:00 AM", close: "6:00 PM" }],
      wednesday: [{ open: "6:00 AM", close: "6:00 PM" }],
      thursday: [{ open: "6:00 AM", close: "6:00 PM" }],
      friday: [{ open: "6:00 AM", close: "6:00 PM" }],
      saturday: [{ open: "6:00 AM", close: "6:00 PM" }],
      sunday: [{ open: "6:00 AM", close: "6:00 PM" }],
    },
    verified: true,
    rating: 4.0,
    reviewCount: 300,
    tags: ["recreation", "jogging", "events"],
  },

  // Mombasa amenities
  {
    name: "Mombasa Hospital",
    type: AmenityType.HOSPITAL,
    category: AmenityCategory.HEALTHCARE,
    description: "Major hospital in Mombasa",
    location: {
      country: "Kenya",
      county: "Mombasa",
      constituency: "Mvita",
      ward: "Tononoka",
      estate: "Mombasa Island",
      address: {
        line1: "Cathedral Road",
        town: "Mombasa",
        postalCode: "80100",
      },
      coordinates: {
        latitude: -4.0435,
        longitude: 39.6682,
      },
    },
    contact: {
      phone: "+254-41-2312191",
    },
    geolocation: {
      type: "Point",
      coordinates: [-4.0435, 39.6682],
    },
    verified: true,
    rating: 4.0,
    tags: ["private", "coastal"],
  },
  {
    name: "Nakumatt Nyali",
    type: AmenityType.SUPERMARKET,
    category: AmenityCategory.SHOPPING,
    description: "Large supermarket in Nyali",
    location: {
      country: "Kenya",
      county: "Mombasa",
      constituency: "Nyali",
      ward: "Frere Town",
      estate: "Nyali",
      address: {
        line1: "Links Road",
        town: "Mombasa",
        postalCode: "80100",
      },
      coordinates: {
        latitude: -4.0238,
        longitude: 39.7053,
      },
    },
    geolocation: {
      type: "Point",
      coordinates: [-4.0238, 39.7053],
    },
    verified: true,
    rating: 4.2,
    tags: ["shopping", "groceries"],
  },

  // Kisumu amenities
  {
    name: "Jaramogi Oginga Odinga Teaching Hospital",
    type: AmenityType.HOSPITAL,
    category: AmenityCategory.HEALTHCARE,
    description: "Main referral hospital in Kisumu",
    location: {
      country: "Kenya",
      county: "Kisumu",
      constituency: "Kisumu Central",
      ward: "Market Milimani",
      estate: "Milimani",
      address: {
        line1: "Kakamega Road",
        town: "Kisumu",
        postalCode: "40100",
      },
      coordinates: {
        latitude: -0.0917,
        longitude: 34.768,
      },
    },
    geolocation: {
      type: "Point",
      coordinates: [-0.0917, 34.768],
    },
    verified: true,
    rating: 3.8,
    tags: ["public", "referral"],
  },

  // Nakuru amenities
  {
    name: "Nakuru Level 5 Hospital",
    type: AmenityType.HOSPITAL,
    category: AmenityCategory.HEALTHCARE,
    location: {
      country: "Kenya",
      county: "Nakuru",
      constituency: "Nakuru Town East",
      ward: "Biashara",
      estate: "Nakuru Town",
      address: {
        line1: "Hospital Road",
        town: "Nakuru",
        postalCode: "20100",
      },
      coordinates: {
        latitude: -0.3031,
        longitude: 36.08,
      },
    },
    geolocation: {
      type: "Point",
      coordinates: [-0.3031, 36.08],
    },
    verified: true,
    tags: ["public", "level 5"],
  },

  // Common amenities found in residential areas
  {
    name: "Greenspan Mall",
    type: AmenityType.SHOPPING_MALL,
    category: AmenityCategory.SHOPPING,
    location: {
      country: "Kenya",
      county: "Nairobi",
      constituency: "Donholm",
      ward: "Umoja I",
      estate: "Donholm",
      address: {
        line1: "Outer Ring Road",
        town: "Nairobi",
        postalCode: "00100",
      },
      coordinates: {
        latitude: -1.3167,
        longitude: 36.8833,
      },
    },
    geolocation: {
      type: "Point",
      coordinates: [-1.3167, 36.8833],
    },
    verified: true,
    rating: 4.1,
    tags: ["shopping", "parking"],
  },
  {
    name: "Karen Hospital",
    type: AmenityType.HOSPITAL,
    category: AmenityCategory.HEALTHCARE,
    description: "Private hospital in Karen",
    location: {
      country: "Kenya",
      county: "Nairobi",
      constituency: "Lang'ata",
      ward: "Karen",
      estate: "Karen",
      address: {
        line1: "Karen Road",
        town: "Nairobi",
        postalCode: "00502",
      },
      coordinates: {
        latitude: -1.3197,
        longitude: 36.7076,
      },
    },
    contact: {
      phone: "+254-20-6610000",
      website: "https://karenhospital.org",
    },
    geolocation: {
      type: "Point",
      coordinates: [-1.3197, 36.7076],
    },
    verified: true,
    rating: 4.6,
    reviewCount: 120,
    tags: ["private", "specialized"],
  },
];

/**
 * Seed the database with Kenyan amenities data
 */
export async function seedKenyanAmenities(): Promise<void> {
  try {
    logger.info("Starting Kenyan amenities seeding...");

    const result = await AmenityService.bulkImportAmenities(
      kenyanAmenitiesSeedData
    );

    logger.info("Kenyan amenities seeding completed", {
      created: result.created,
      errors: result.errors,
      errorDetails: result.errorDetails,
    });

    if (result.errors > 0) {
      logger.warn("Some amenities failed to import:", result.errorDetails);
    }
  } catch (error) {
    logger.error("Error seeding Kenyan amenities:", error);
    throw error;
  }
}

/**
 * Clear all amenities (for re-seeding)
 */
export async function clearAmenities(): Promise<void> {
  try {
    const { Amenity } = await import("@kaa/models");
    await Amenity.deleteMany({});
    logger.info("Cleared all amenities");
  } catch (error) {
    logger.error("Error clearing amenities:", error);
    throw error;
  }
}
