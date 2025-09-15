/** @type {import('tailwindcss').Config} */
const tailwindConfig = require("@kaa/tailwind-config");

module.exports = {
  ...tailwindConfig,
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui-native/**/*.{js,jsx,ts,tsx}",
    "!node_modules",
  ],
  presets: [require("nativewind/preset")],
};
