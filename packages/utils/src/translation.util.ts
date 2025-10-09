/**
 * Translation Utility
 *
 * Provides translation services for English to Swahili and vice versa
 * Uses comprehensive local translations for legal documents
 */

import { logger } from "./logger.util";

// Comprehensive English to Swahili translations for legal documents
const LEGAL_TRANSLATIONS: Record<string, string> = {
  // Document Types
  "RENTAL AGREEMENT": "MAKUBALIANO YA KUKODISHA",
  "TENANCY AGREEMENT": "MAKUBALIANO YA UPANGAJI",
  "LEASE AGREEMENT": "MAKUBALIANO YA KUKODISHA",
  "NOTICE TO QUIT": "NOTISI YA KUONDOKA",
  "RENTAL RECEIPT": "RISITI YA KODI",
  "INSPECTION REPORT": "RIPOTI YA UKAGUZI",
  "MAINTENANCE AGREEMENT": "MAKUBALIANO YA MATENGENEZO",
  "TERMINATION NOTICE": "NOTISI YA KUMALIZA",

  // Parties
  Landlord: "Mwenye Nyumba",
  Tenant: "Mpangaji",
  Guarantor: "Mdhamini",
  Witness: "Shahidi",
  Agent: "Wakala",
  "THE LANDLORD": "MWENYE NYUMBA",
  "THE TENANT": "MPANGAJI",

  // Property Terms
  Property: "Mali",
  Premises: "Eneo",
  Unit: "Kitengo",
  Apartment: "Ghorofa",
  House: "Nyumba",
  Room: "Chumba",
  Building: "Jengo",
  Address: "Anwani",
  Location: "Mahali",

  // Financial Terms
  Rent: "Kodi",
  Deposit: "Dhamana",
  "Security Deposit": "Dhamana ya Usalama",
  Payment: "Malipo",
  Amount: "Kiasi",
  Monthly: "Kila Mwezi",
  monthly: "kila mwezi",
  KES: "KSh",
  Shillings: "Shilingi",
  Cost: "Gharama",
  Fee: "Ada",
  Charge: "Malipo",
  Balance: "Salio",
  Arrears: "Madeni",

  // Time Terms
  Month: "Mwezi",
  Months: "Miezi",
  Year: "Mwaka",
  Years: "Miaka",
  Day: "Siku",
  Days: "Siku",
  Week: "Wiki",
  Date: "Tarehe",
  Period: "Kipindi",
  Duration: "Muda",
  Term: "Kipindi",

  // Legal Terms
  Agreement: "Makubaliano",
  Contract: "Mkataba",
  "Terms and Conditions": "Masharti na Vigezo",
  "TERMS AND CONDITIONS": "MASHARTI NA VIGEZO",
  Clause: "Kifungu",
  Section: "Sehemu",
  Article: "Ibara",
  Signature: "Saini",
  Signed: "Amesaini",
  Executed: "Imetekelezwa",
  Witnessed: "Kushuhudiwa",
  Notarized: "Kuthibitishwa",
  Legal: "Kisheria",
  Law: "Sheria",
  Court: "Mahakama",
  Notice: "Notisi",
  Termination: "Kumaliza",
  Renewal: "Kufanya Upya",
  Extension: "Kuongeza",

  // Actions
  shall: "itakuwa",
  must: "lazima",
  will: "ita",
  may: "inaweza",
  agree: "kukubaliana",
  pay: "kulipa",
  maintain: "kudumisha",
  repair: "kutengeneza",
  provide: "kutoa",
  deliver: "kuwasilisha",
  terminate: "kumaliza",
  renew: "kufanya upya",
  sign: "kusaini",

  // Common Phrases
  "THIS AGREEMENT": "MAKUBALIANO HII",
  "is made": "imefanywa",
  between: "kati ya",
  and: "na",
  on: "tarehe",
  for: "kwa",
  of: "ya",
  in: "katika",
  at: "kwenye",
  with: "na",
  by: "na",
  from: "kutoka",
  to: "hadi",
  "as follows": "kama ifuatavyo",
  hereby: "hapa",
  herein: "humu",
  hereof: "ya hii",
  thereof: "ya hiyo",
  whereas: "ikizingatiwa",
  therefore: "kwa hiyo",
  notwithstanding: "licha ya",
  "pursuant to": "kulingana na",
  "in accordance with": "kwa mujibu wa",
  "subject to": "kwa masharti ya",
  "due on": "inadaiwa tarehe",
  "is required": "inahitajika",
  "shall commence": "itaanza",
  "shall be responsible for": "atawajibika kwa",
  "shall maintain": "atadumisha",
  "may terminate": "anaweza kumaliza",
  "written notice": "notisi ya maandishi",
  "governed by": "inasimamiwa na",
  "Laws of Kenya": "Sheria za Kenya",
  "IN WITNESS WHEREOF": "KWA USHUHUDA WA HILI",
  "the parties have executed": "wahusika wametekeleza",
  "on the date first written above": "tarehe iliyoandikwa hapo juu",

  // Utilities & Services
  Electricity: "Umeme",
  Water: "Maji",
  Gas: "Gesi",
  Internet: "Mtandao",
  Utilities: "Huduma",
  Services: "Huduma",
  Maintenance: "Matengenezo",
  Repairs: "Marekebisho",

  // Responsibilities
  Responsibility: "Wajibu",
  Obligation: "Wajibu",
  Duty: "Wajibu",
  Right: "Haki",
  Rights: "Haki",
  Privilege: "Upendeleo",

  // Counties (Kenya)
  County: "Kaunti",
  Nairobi: "Nairobi",
  Mombasa: "Mombasa",
  Kisumu: "Kisumu",
  Nakuru: "Nakuru",
  Kiambu: "Kiambu",
};

/**
 * Translate text from English to Swahili
 */
export async function translateToSwahili(text: string): Promise<string> {
  try {
    let translated = text;

    // Sort by length (longest first) to avoid partial replacements
    const sortedTranslations = Object.entries(LEGAL_TRANSLATIONS).sort(
      ([a], [b]) => b.length - a.length
    );

    for (const [english, swahili] of sortedTranslations) {
      // Case-insensitive replacement
      const regex = new RegExp(
        english.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "gi"
      );
      translated = translated.replace(regex, swahili);
    }

    return await Promise.resolve(translated);
  } catch (error) {
    logger.error("Translation error:", error);
    return text;
  }
}

/**
 * Translate text from Swahili to English
 */
export async function translateToEnglish(text: string): Promise<string> {
  try {
    let translated = text;

    const reverseTranslations = Object.entries(LEGAL_TRANSLATIONS)
      .map(([english, swahili]) => [swahili, english] as [string, string])
      .sort(([a], [b]) => b.length - a.length);

    for (const [swahili, english] of reverseTranslations) {
      const regex = new RegExp(
        swahili.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "gi"
      );
      translated = translated.replace(regex, english);
    }

    return await Promise.resolve(translated);
  } catch (error) {
    logger.error("Translation error:", error);
    return text;
  }
}

/**
 * Get translation for a specific term
 */
export function getTranslation(term: string, toSwahili = true): string {
  if (toSwahili) {
    return LEGAL_TRANSLATIONS[term] || term;
  }

  const entry = Object.entries(LEGAL_TRANSLATIONS).find(
    ([_, swahili]) => swahili.toLowerCase() === term.toLowerCase()
  );

  return entry ? entry[0] : term;
}

/**
 * Add a custom translation
 */
export function addTranslation(english: string, swahili: string): void {
  LEGAL_TRANSLATIONS[english] = swahili;
}
