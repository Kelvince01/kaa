export * from "./file.constants";
export * from "./mpesa.constants";

// Kenyan Counties
export const KENYAN_COUNTIES = [
  "Nairobi",
  "Mombasa",
  "Kiambu",
  "Nakuru",
  "Machakos",
  "Kajiado",
  "Murang'a",
  "Kirinyaga",
  "Nyeri",
  "Nyandarua",
  "Laikipia",
  "Meru",
  "Tharaka Nithi",
  "Embu",
  "Kitui",
  "Makueni",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita Taveta",
  "Garissa",
  "Wajir",
  "Mandera",
  "Marsabit",
  "Isiolo",
  "Samburu",
  "Turkana",
  "West Pokot",
  "Trans Nzoia",
  "Uasin Gishu",
  "Elgeyo Marakwet",
  "Nandi",
  "Baringo",
  "Kericho",
  "Bomet",
  "Kakamega",
  "Vihiga",
  "Bungoma",
  "Busia",
  "Siaya",
  "Kisumu",
  "Homa Bay",
  "Migori",
  "Kisii",
  "Nyamira",
];

// Major Estates/Neighborhoods by County
export const NAIROBI_ESTATES = [
  "Westlands",
  "Kilimani",
  "Karen",
  "Lavington",
  "Kileleshwa",
  "Runda",
  "Muthaiga",
  "Spring Valley",
  "Loresho",
  "Gigiri",
  "Parklands",
  "Highridge",
  "Riverside",
  "Valley Arcade",
  "Brookside",
  "Kasarani",
  "Thika Road",
  "Ruaka",
  "Kiambu Road",
  "Garden City",
  "South B",
  "South C",
  "Langata",
  "Mbagathi",
  "Rongai",
  "Pipeline",
  "Imara Daima",
  "Nyayo Estate",
  "Buru Buru",
  "Buruburu Phase 2",
  "Eastleigh",
  "California",
  "Pangani",
  "Ngara",
  "Huruma",
  "Mathare",
  "Kariobangi",
  "Dandora",
  "Kayole",
  "Umoja",
  "Embakasi",
  "Donholm",
  "Savannah",
  "Fedha Estate",
  "Greenspan",
  "Kiambu",
  "Ruiru",
  "Juja",
  "Thika",
  "Limuru",
];

export const MOMBASA_ESTATES = [
  "Nyali",
  "Bamburi",
  "Shanzu",
  "Kizingo",
  "Tudor",
  "Buxton",
  "Ganjoni",
  "Mkomani",
  "Mtongwe",
  "Likoni",
  "Port Reitz",
  "Changamwe",
  "Jomvu",
  "Miritini",
  "Bombolulu",
];

export const NAKURU_ESTATES = [
  "Milimani",
  "Section 58",
  "Flamingo",
  "London",
  "Pipeline",
  "Shabab",
  "Bondeni",
  "Kivumbini",
  "Langalanga",
  "Free Area",
  "Bahati",
  "Subukia",
  "Njoro",
  "Molo",
  "Naivasha",
];

// Phone number patterns for Kenya
export const KENYAN_PHONE_PATTERNS = {
  SAFARICOM: /^(?:\+254|0)(?:7(?:[01249][0-9]|5[789]|6[89])|1[1]0)/,
  AIRTEL: /^(?:\+254|0)(?:7(?:3[0-9]|5[0-6])|1[0]0)/,
  TELKOM: /^(?:\+254|0)(?:7(?:7[0-9])|1[1]1)/,
  FULL_PATTERN: /^(?:\+254|0)(?:7[0-9]{8}|1[01][0-9]{7})$/,
};

// M-Pesa configuration
export const MPESA_CONFIG = {
  TILL_NUMBERS: /^[0-9]{5,7}$/,
  PAYBILL_NUMBERS: /^[0-9]{5,6}$/,
  TRANSACTION_CODES: /^[A-Z0-9]{10}$/,
  SHORTCODES: {
    SAFARICOM_SANDBOX: "174379",
    // Add production shortcodes when available
  },
};

// National ID patterns
export const NATIONAL_ID_PATTERN = /^[0-9]{7,8}$/;
export const PASSPORT_PATTERN = /^[A-Z][0-9]{7}$/;
export const ALIEN_ID_PATTERN = /^[0-9]{8,9}$/;

// Common amenities in Kenyan properties
export const COMMON_AMENITIES = [
  "Water",
  "Electricity",
  "Parking",
  "Security",
  "Garden",
  "Swimming Pool",
  "Gym",
  "Lift/Elevator",
  "Generator",
  "DSTV Ready",
  "Internet Ready",
  "Balcony",
  "Store Room",
  "Servant Quarter",
  "Borehole",
  "Solar Water Heating",
  "Perimeter Wall",
  "Electric Fence",
  "CCTV",
  "Garbage Collection",
];

// Transportation modes
export const TRANSPORT_MODES = [
  "Matatu",
  "Bus",
  "Boda Boda",
  "Taxi",
  "Uber/Bolt",
  "Private Car",
  "Walking Distance",
  "Train/SGR",
];

// Property features specific to Kenya
export const KENYAN_PROPERTY_FEATURES = [
  "Boys Quarter",
  "DSQ (Domestic Staff Quarters)",
  "Compound",
  "Gate",
  "Watchman Quarter",
  "Water Tank",
  "Septic Tank",
  "Biogas Plant",
  "Kitchen Garden",
  "Laundry Area",
];

// Banking codes for major Kenyan banks
export const BANK_CODES = {
  KCB: "01",
  EQUITY: "68",
  COOPERATIVE: "11",
  ABSA: "03",
  STANDARD_CHARTERED: "02",
  I_M_BANK: "57",
  FAMILY_BANK: "70",
  DIAMOND_TRUST: "63",
  CBA: "31",
  NCBA: "07",
};

// Common rental terms in Kenya
export const RENTAL_TERMS = {
  DEPOSIT_MONTHS: [1, 2, 3], // months of rent as deposit
  ADVANCE_MONTHS: [1, 2, 3], // months paid in advance
  LEASE_PERIODS: [6, 12, 24, 36], // months
  PAYMENT_FREQUENCIES: ["monthly", "quarterly", "semi-annually", "annually"],
};

// Utility providers
export const UTILITY_PROVIDERS = {
  ELECTRICITY: ["KPLC", "Kenya Power"],
  WATER: ["Nairobi Water", "Coast Water", "Nakuru Water", "Eldoret Water"],
  INTERNET: ["Safaricom", "Airtel", "Telkom", "JTL", "Liquid"],
  TV: ["DSTV", "GOtv", "Startimes", "Zuku", "Viusasa"],
};

// Business hours in Kenya
export const BUSINESS_HOURS = {
  WEEKDAYS: { open: "08:00", close: "17:00" },
  SATURDAY: { open: "08:00", close: "13:00" },
  SUNDAY: { open: null, close: null }, // Generally closed
  TIMEZONE: "Africa/Nairobi", // EAT (UTC+3)
};

// Public holidays in Kenya (common ones)
export const PUBLIC_HOLIDAYS = [
  { name: "New Year's Day", date: "01-01" },
  { name: "Good Friday", date: "variable" },
  { name: "Easter Monday", date: "variable" },
  { name: "Labour Day", date: "05-01" },
  { name: "Madaraka Day", date: "06-01" },
  { name: "Mashujaa Day", date: "10-20" },
  { name: "Jamhuri Day", date: "12-12" },
  { name: "Christmas Day", date: "12-25" },
  { name: "Boxing Day", date: "12-26" },
];

// Currency formatting
export const CURRENCY = {
  CODE: "KES",
  SYMBOL: "KSh",
  NAME: "Kenyan Shilling",
  DECIMAL_PLACES: 2,
};

// Common price ranges for different property types (in KES)
export const PRICE_RANGES = {
  BEDSITTER: { min: 3000, max: 15_000 },
  ONE_BEDROOM: { min: 8000, max: 30_000 },
  TWO_BEDROOM: { min: 15_000, max: 60_000 },
  THREE_BEDROOM: { min: 25_000, max: 100_000 },
  FOUR_BEDROOM: { min: 40_000, max: 200_000 },
  STUDIO: { min: 5000, max: 20_000 },
  MAISONETTE: { min: 30_000, max: 150_000 },
  BUNGALOW: { min: 50_000, max: 300_000 },
};

export default {
  KENYAN_COUNTIES,
  NAIROBI_ESTATES,
  MOMBASA_ESTATES,
  NAKURU_ESTATES,
  KENYAN_PHONE_PATTERNS,
  MPESA_CONFIG,
  NATIONAL_ID_PATTERN,
  PASSPORT_PATTERN,
  ALIEN_ID_PATTERN,
  COMMON_AMENITIES,
  TRANSPORT_MODES,
  KENYAN_PROPERTY_FEATURES,
  BANK_CODES,
  RENTAL_TERMS,
  UTILITY_PROVIDERS,
  BUSINESS_HOURS,
  PUBLIC_HOLIDAYS,
  CURRENCY,
  PRICE_RANGES,
};
