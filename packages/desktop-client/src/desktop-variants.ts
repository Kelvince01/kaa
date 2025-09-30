const plugin = require("tailwindcss/plugin");

type ModifySelectorsArgs = {
  className: string;
};

type VariantOptions = {
  modifySelectors: (callback: (args: ModifySelectorsArgs) => string) => void;
  separator: string;
};

type PluginApi = {
  addVariant: (
    name: string,
    callback: (options: VariantOptions) => void
  ) => void;
  e: (className: string) => string;
};

const desktopPlugin = plugin(({ addVariant, e }: PluginApi) => {
  // Add support for `desktop` modifier
  // Usage: <div class="desktop:rounded-lg">...</div>
  addVariant("desktop", ({ modifySelectors, separator }: VariantOptions) => {
    modifySelectors(
      ({ className }: ModifySelectorsArgs) =>
        `html.desktop .${e(`desktop${separator}${className}`)}`
    );
  });

  // Add support for `mac`, `windows` and `linux` modifiers
  // Usage: <div class="mac:hidden">...</div>
  const platformMap = {
    darwin: "mac",
    win32: "windows",
    linux: "linux",
  } as const;

  for (const platform of Object.keys(platformMap) as Array<
    keyof typeof platformMap
  >) {
    const variant = platformMap[platform];
    addVariant(variant, ({ modifySelectors, separator }: VariantOptions) => {
      modifySelectors(
        ({ className }: ModifySelectorsArgs) =>
          `html.desktop-platform-${platform} .${e(
            `${variant}${separator}${className}`
          )}`
      );
    });
  }
});

export default desktopPlugin;
