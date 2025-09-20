export const config = {
  mode: "development",
  name: "Kaa",
  slug: "kaa",
  sentryOrg: "optiflow-softwares",
  sentryProject: "kaa-saas",

  domain: "kaapro.dev",
  frontendUrl: "https://kaapro.dev",
  backendUrl: "https://api.kaapro.dev", // "https://kaa-api.onrender.com",
  backendAuthUrl: "https://api.kaapro.dev/auth",
  tusUrl: "https://tus.kaapro.dev",

  defaultRedirectPath: "/",
  welcomeRedirectPath: "/welcome",

  aboutUrl: "https://kaapro.dev/about",
  statusUrl: "https://status.kaapro.dev",
  productionUrl: "https://kaapro.dev",

  sentryDsn:
    "https://a5d4543799ddd3be8223234a4f3abb31@o4507802937196544.ingest.de.sentry.io/4508965440323664",
  sentSentrySourceMaps: true,

  debug: false,
  maintenance: false,

  // File handling with imado
  tusPort: 4100,
  s3UploadBucket: "kaa-uploads",
  s3UploadRegion: "eu-west-1",
  privateCDNUrl: "https://cdn-priv.kaapro.dev",
  publicCDNUrl: "https://cdn.kaapro.dev",

  themeColor: "#26262b",

  // Theme settings
  theme: {
    colors: {
      rose: "#e11d48",
    },
    colorDarkBackground: "hsl(240 10% 9%)",
    strokeWidth: 1.5,
    screenSizes: {
      xs: "420px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1400px",
    },
  } as const,

  // Placeholder colors
  placeholderColors: [
    "bg-blue-300",
    "bg-lime-300",
    "bg-orange-300",
    "bg-yellow-300",
    "bg-green-300",
    "bg-teal-300",
    "bg-indigo-300",
    "bg-purple-300",
    "bg-pink-300",
    "bg-red-300",
  ],

  googleMapsKey: "AIzaSyAGx1ZAPoNIu8tUWD4F0D2B3XwAOaSMMH8",

  // Optional settings
  has: {
    pwa: true, // Progressive Web App support for preloading static assets and offline support
    sync: true, // Realtime updates and sync using Electric Sync
    registrationEnabled: true, // Allow users to sign up. If disabled, the app is by invitation only
    waitlist: false, // Suggest a waitlist for unknown emails when sign up is disabled,
    imado: false, // Imado fully configured, if false, files will be stored in local browser (indexedDB)
  },

  /**
   * Default language
   */
  defaultLanguage: "en-KE" as const,

  /**
   * Language options
   */
  languages: ["en-KE", "sw-KE"] as const,

  /**
   * Error handling.
   */
  severityLevels: ["debug", "log", "info", "warn", "error"] as const,

  /**
   * All entity types used in the app
   */
  entityTypes: [
    "user",
    "organization",
    "attachment",
    "property",
    "role",
    "permission",
  ] as const,

  /**
   * Page entity types (pages with memberships + users)
   */
  pageEntityTypes: ["user", "organization", "property", "member"] as const,

  /**
   * Context entity types (memberships)
   */
  contextEntityTypes: [
    "role",
    "user",
    "property",
    "organization",
    "attachment",
    "permission",
  ] as const,

  /**
   * Product entity types (mostly content)
   */
  productEntityTypes: ["attachment"] as const,

  /**
   * Default request limits for lists
   *
   * By default, BE common-schemas enforce a maximum limit of 1000 items via `limitRefine`.
   * if some of requested limit need to exceed 1000, make sure to adjust `limitRefine` accordingly.
   */
  requestLimits: {
    default: 40,
    users: 100,
    members: 40,
    properties: 50,
    units: 50,
    organizations: 40,
    requests: 40,
    files: 40,
    memberInvitations: 20,
    permissions: 40,
    bookings: 40,
  },

  /**
   * Roles on system and entity level.
   */
  rolesByType: {
    systemRoles: ["user", "admin"] as const,
    entityRoles: ["member", "admin"] as const,
    allRoles: ["user", "member", "admin"] as const,
  },

  /**
   * Company details.
   */
  company: {
    name: "Kaa",
    shortName: "Kaa",
    email: "info@kaapro.dev",
    postcode: "90210 JS",
    tel: "+254 700 12345678",
    streetAddress: "Nairobi Road 42",
    city: "Nairobi",
    country: "Kenya",
    googleMapsUrl: "https://goo.gl/maps/SQlrh",
    scheduleCallUrl: "https://cal.com/kaapro",
    githubUrl: "https://github.com/Kelvince01/kaa",
    mapZoom: 4,
    coordinates: {
      lat: -1.2925,
      lng: 36.8219,
    },
  },

  /**
   * Uppy file uploader settings.
   */
  uppy: {
    defaultRestrictions: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxNumberOfFiles: 1,
      allowedFileTypes: [".jpg", ".jpeg", ".png"],
      maxTotalFileSize: 100 * 1024 * 1024, // 100MB
    },
  },
};

export default config;

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export type Config = DeepPartial<typeof config>;
