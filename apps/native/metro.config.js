const { FileStore } = require("metro-cache");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("node:path");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

// biome-ignore lint/correctness/noGlobalDirnameFilename: false positive
const currentDir = __dirname;
const projectRoot = currentDir;

const getConfig = getDefaultConfig(currentDir);

const config = withTurborepoManagedCache(
  withNativeWind(getSentryExpoConfig(currentDir, getConfig), {
    input: "./global.css",
    projectRoot,
    inlineRem: false,
    features: {
      transformPercentagePolyfill: true,
    },
  })
);

// config.resolver.unstable_enablePackageExports = true;

// config.resolver.resolveRequest = (context, moduleName, platform) => {
//   if (moduleName === "zustand" || moduleName.startsWith("zustand/")) {
//     //? Resolve to its CommonJS entry (fallback to main/index.js)
//     return {
//       type: "sourceFile",
//       //? require.resolve will pick up the CJS entry (index.js) since "exports" is bypassed
//       filePath: require.resolve(moduleName),
//     };
//   }

//   return context.resolveRequest(context, moduleName, platform);
// };

module.exports = config;

/**
 * Move the Metro cache to the `.cache/metro` folder.
 * If you have any environment variables, you can configure Turborepo to invalidate it when needed.
 *
 * @see https://turbo.build/repo/docs/reference/configuration#env
 * @param {import('expo/metro-config').MetroConfig} config
 * @returns {import('expo/metro-config').MetroConfig}
 */
function withTurborepoManagedCache(config) {
  config.cacheStores = [
    new FileStore({ root: path.join(__dirname, ".cache/metro") }),
  ];
  return config;
}
