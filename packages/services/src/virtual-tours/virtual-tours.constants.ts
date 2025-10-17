// Kenya-specific constants for virtual tours
export const KENYA_TOUR_CONSTANTS = {
  COUNTIES: [
    "Nairobi",
    "Mombasa",
    "Kiambu",
    "Machakos",
    "Kajiado",
    "Nakuru",
    "Uasin Gishu",
    "Kisumu",
    "Kakamega",
    "Bungoma",
    "Trans Nzoia",
    "Kericho",
    "Bomet",
    "Nyeri",
    "Meru",
    "Embu",
    "Tharaka-Nithi",
    "Kirinyaga",
    "Murang'a",
    "Laikipia",
    "Nyandarua",
    "Nandi",
    "Baringo",
    "Elgeyo-Marakwet",
    "West Pokot",
    "Samburu",
    "Turkana",
    "Marsabit",
    "Isiolo",
    "Meru",
    "Tharaka-Nithi",
    "Embu",
    "Kitui",
    "Machakos",
    "Makueni",
    "Taita-Taveta",
    "Kwale",
    "Kilifi",
    "Tana River",
    "Lamu",
    "Garissa",
    "Wajir",
    "Mandera",
    "Siaya",
    "Kisumu",
    "Homa Bay",
    "Migori",
    "Kisii",
    "Nyamira",
    "Bomet",
    "Kericho",
    "Nandi",
    "Vihiga",
    "Kakamega",
    "Bungoma",
    "Busia",
  ],

  PROPERTY_TYPES: [
    "apartment",
    "house",
    "mansion",
    "townhouse",
    "villa",
    "studio",
    "bedsitter",
    "single_room",
    "maisonette",
    "bungalow",
    "commercial",
    "office",
    "warehouse",
    "retail",
    "industrial",
    "land",
    "farm",
  ],

  COMMON_AMENITIES: [
    "parking",
    "security",
    "water",
    "electricity",
    "internet",
    "swimming_pool",
    "gym",
    "garden",
    "balcony",
    "terrace",
    "backup_generator",
    "borehole",
    "servant_quarter",
    "play_area",
    "laundry",
    "lift",
    "cctv",
    "gate",
    "fence",
    "solar_power",
    "air_conditioning",
    "heating",
    "fireplace",
    "study_room",
    "dining_room",
    "family_room",
    "guest_room",
    "pantry",
    "store_room",
    "garage",
    "carport",
    "driveway",
    "compound",
  ],

  NETWORK_OPTIMIZATION: {
    MOBILE_MAX_SIZE: 50 * 1024 * 1024, // 50MB for mobile
    DESKTOP_MAX_SIZE: 100 * 1024 * 1024, // 100MB for desktop
    COMPRESSION_QUALITY: {
      HIGH: 0.9,
      MEDIUM: 0.7,
      LOW: 0.5,
    },
    CDN_REGIONS: ["nairobi", "mombasa", "nakuru", "kisumu", "eldoret"],
    SUPPORTED_FORMATS: {
      IMAGES: ["jpg", "jpeg", "png", "webp", "tiff"],
      VIDEOS: ["mp4", "webm", "mov", "avi"],
      MODELS: ["gltf", "glb", "obj", "fbx"],
      AUDIO: ["mp3", "wav", "ogg", "aac"],
    },
  },

  TOUR_LIMITS: {
    MAX_SCENES_PER_TOUR: 50,
    MAX_HOTSPOTS_PER_SCENE: 20,
    MAX_CONNECTIONS_PER_SCENE: 10,
    MAX_TOUR_TITLE_LENGTH: 200,
    MAX_TOUR_DESCRIPTION_LENGTH: 1000,
    MAX_SCENE_NAME_LENGTH: 100,
    MAX_HOTSPOT_TITLE_LENGTH: 100,
  },

  DEFAULT_SETTINGS: {
    AUTO_ROTATE_SPEED: 2,
    INITIAL_FOV: 75,
    HOTSPOT_SIZE: 20,
    TRANSITION_DURATION: 1000,
    CACHE_DURATION: 86_400 * 7, // 7 days
    SESSION_TIMEOUT: 3600, // 1 hour
  },

  ANALYTICS_RETENTION: {
    DETAILED_LOGS: 30, // days
    AGGREGATED_DATA: 365, // days
    HEATMAP_DATA: 90, // days
  },
};

// Tour type configurations
export const TOUR_TYPE_CONFIG = {
  PHOTO_360: {
    name: "Photo 360°",
    description: "360-degree panoramic photography",
    supportedFormats: ["jpg", "jpeg", "png", "webp"],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    processingRequired: true,
  },
  VIDEO_360: {
    name: "Video 360°",
    description: "360-degree video experience",
    supportedFormats: ["mp4", "webm"],
    maxFileSize: 200 * 1024 * 1024, // 200MB
    processingRequired: true,
  },
  THREE_D_MODEL: {
    name: "3D Model",
    description: "Interactive 3D model walkthrough",
    supportedFormats: ["gltf", "glb"],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    processingRequired: false,
  },
  VIRTUAL_REALITY: {
    name: "Virtual Reality",
    description: "VR-compatible immersive experience",
    supportedFormats: ["jpg", "jpeg", "png", "webp", "mp4"],
    maxFileSize: 100 * 1024 * 1024, // 100MB
    processingRequired: true,
  },
  AUGMENTED_REALITY: {
    name: "Augmented Reality",
    description: "AR overlay on real environment",
    supportedFormats: ["gltf", "glb", "jpg", "jpeg", "png"],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    processingRequired: true,
  },
  INTERACTIVE_WALKTHROUGH: {
    name: "Interactive Walkthrough",
    description: "Connected scenes with navigation",
    supportedFormats: ["jpg", "jpeg", "png", "webp"],
    maxFileSize: 50 * 1024 * 1024, // 50MB
    processingRequired: true,
  },
  DRONE_AERIAL: {
    name: "Drone Aerial",
    description: "Aerial drone photography/video",
    supportedFormats: ["jpg", "jpeg", "png", "mp4"],
    maxFileSize: 200 * 1024 * 1024, // 200MB
    processingRequired: true,
  },
};

// Hotspot type configurations
export const HOTSPOT_TYPE_CONFIG = {
  INFO: {
    name: "Information",
    icon: "info-circle",
    color: "#3b82f6",
    defaultSize: 20,
  },
  NAVIGATION: {
    name: "Navigation",
    icon: "arrow-right",
    color: "#10b981",
    defaultSize: 25,
  },
  MEDIA: {
    name: "Media",
    icon: "play-circle",
    color: "#f59e0b",
    defaultSize: 22,
  },
  PRODUCT: {
    name: "Product",
    icon: "shopping-bag",
    color: "#ef4444",
    defaultSize: 20,
  },
  CONTACT: {
    name: "Contact",
    icon: "phone",
    color: "#8b5cf6",
    defaultSize: 20,
  },
  MEASUREMENT: {
    name: "Measurement",
    icon: "ruler",
    color: "#06b6d4",
    defaultSize: 18,
  },
  ANNOTATION: {
    name: "Annotation",
    icon: "message-circle",
    color: "#84cc16",
    defaultSize: 20,
  },
};

// Error messages
export const TOUR_ERROR_MESSAGES = {
  TOUR_NOT_FOUND: "Virtual tour not found",
  SCENE_NOT_FOUND: "Scene not found",
  HOTSPOT_NOT_FOUND: "Hotspot not found",
  PROPERTY_NOT_FOUND: "Property not found",
  UNAUTHORIZED_ACCESS: "Not authorized to access this tour",
  UNAUTHORIZED_MODIFY: "Not authorized to modify this tour",
  INVALID_FILE_TYPE: "File type not supported",
  FILE_TOO_LARGE: "File size exceeds maximum limit",
  TOUR_ALREADY_PUBLISHED: "Tour is already published",
  CANNOT_PUBLISH_EMPTY_TOUR: "Cannot publish tour without scenes",
  MAX_SCENES_EXCEEDED: "Maximum number of scenes exceeded",
  MAX_HOTSPOTS_EXCEEDED: "Maximum number of hotspots per scene exceeded",
  PROCESSING_FAILED: "Media processing failed",
  UPLOAD_FAILED: "File upload failed",
  INVALID_TOUR_DATA: "Invalid tour data provided",
};

// Success messages
export const TOUR_SUCCESS_MESSAGES = {
  TOUR_CREATED: "Virtual tour created successfully",
  TOUR_UPDATED: "Virtual tour updated successfully",
  TOUR_DELETED: "Virtual tour deleted successfully",
  TOUR_PUBLISHED: "Virtual tour published successfully",
  TOUR_DUPLICATED: "Virtual tour duplicated successfully",
  SCENE_ADDED: "Scene added successfully",
  SCENE_UPDATED: "Scene updated successfully",
  SCENE_DELETED: "Scene deleted successfully",
  HOTSPOT_ADDED: "Hotspot added successfully",
  HOTSPOT_UPDATED: "Hotspot updated successfully",
  HOTSPOT_DELETED: "Hotspot deleted successfully",
  MEDIA_UPLOADED: "Media uploaded successfully",
  ANALYTICS_RETRIEVED: "Analytics retrieved successfully",
  EMBED_CODE_GENERATED: "Embed code generated successfully",
};
