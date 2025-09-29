import { resolve } from "node:path";
// biome-ignore lint/style/noExportedImports: false positive
import i18n from "i18next";
import Backend from "i18next-fs-backend";
import { I18N_CONFIG } from "./config/i18n.config";

// import {
//   DEFAULT_LOCALE,
//   SUPPORTED_LOCALES,
//   TRANSLATIONS,
// } from "./config/locale.config";

await i18n.use(Backend).init({
  fallbackLng: I18N_CONFIG.fallbackLng,
  preload: I18N_CONFIG.preload,
  supportedLngs: I18N_CONFIG.supportedLngs,
  debug: I18N_CONFIG.debug,
  ns: I18N_CONFIG.namespaces,
  defaultNS: I18N_CONFIG.defaultNS,
  backend: {
    loadPath: resolve(
      process.cwd(),
      `${I18N_CONFIG.localesPath}/{{lng}}/{{ns}}.json`
    ),
  },
  interpolation: {
    escapeValue: false,
  },
});

// .use(
//   i18next({
//     initOptions: {
//       lng: DEFAULT_LOCALE,
//       resources: TRANSLATIONS,
//       fallbackLng: DEFAULT_LOCALE,
//       supportedLngs: SUPPORTED_LOCALES,
//       detection: {
//         order: ["header", "querystring"],
//         lookupHeader: "accept-language",
//         lookupQuerystring: "lang",
//       },
//     },
//   })
// )

export { i18n };
