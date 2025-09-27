// biome-ignore lint/style/noExportedImports: export countries as is
import countries from "./countries.json" with { type: "json" };

export { countries };
