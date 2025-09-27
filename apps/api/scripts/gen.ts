// Updated generator script to match Elysia-based structure and modern routing
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

function ensureDir(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

function genController(name: string) {
  const content = `// src/server/controllers/${name}.ts
import type { Context } from 'elysia';

export async function ${name}Controller({}: Context): Promise<any> {
  return { message: "${name} controller works" };
}`;

  const path = resolve(`src/server/controllers/${name}.ts`);
  writeFileSync(path, content);
  console.log(`✔ Controller created: ${path}`);
}

function genRoute(name: string, type: "guest" | "protected") {
  const controllerName = `${name}Controller`;
  const routePath = resolve(`src/server/routes/${type}.ts`);
  const controllerImport = `import { ${controllerName} } from '@/server/controllers/${name}';`;

  if (!existsSync(routePath)) {
    const content = `// src/server/routes/${type}.ts
import { Elysia } from 'elysia';
${controllerImport}

export const ${type}Routes = new Elysia({ prefix: '/api' })
  .get('/${type}/${name.toLowerCase()}', ${controllerName});
`;
    writeFileSync(routePath, content);
    console.log(`✔ Route file created: ${routePath}`);
    return;
  }

  let file = readFileSync(routePath, "utf8");

  if (!file.includes(controllerImport)) {
    file = `${controllerImport}\n${file}`;
  }

  const insertIndex = file.lastIndexOf(".get(");
  const routeCode = `\n  .get('/${type}/${name.toLowerCase()}', ${controllerName})`;
  const insertAt = file.lastIndexOf(";");
  file = file.slice(0, insertAt) + routeCode + file.slice(insertAt);
  writeFileSync(routePath, file);
  console.log(`✔ Route added to ${routePath}`);
}

function genModel(name: string) {
  const content = `// src/server/models/${name}.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const ${name} = sqliteTable('${name.toLowerCase()}', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql\`CURRENT_TIMESTAMP\`),
});

export type ${name}Type = typeof ${name}.$inferSelect;`;

  const path = resolve(`src/server/models/${name}.ts`);
  writeFileSync(path, content);
  console.log(`✔ Model created: ${path}`);
}

function genMiddleware(name: string) {
  const content = `// src/server/middleware/${name}.ts
import type { Context } from 'elysia';

export async function ${name}(ctx: Context): Promise<boolean> {
  // Add your middleware logic here
  return true;
}`;

  const path = resolve(`src/server/middleware/${name}.ts`);
  writeFileSync(path, content);
  console.log(`✔ Middleware created: ${path}`);
}

function usage() {
  console.log("Usage:");
  console.log("  bun run src/scripts/gen.ts controller <Name>");
  console.log("  bun run src/scripts/gen.ts route <Name> <guest|protected>");
  console.log("  bun run src/scripts/gen.ts model <Name>");
  console.log("  bun run src/scripts/gen.ts middleware <Name>");
  process.exit(1);
}

const [, , type, ...args] = process.argv;
if (!type || args.length === 0) usage();

ensureDir("src/server");

switch (type) {
  case "controller":
    genController(args[0]);
    break;
  case "route":
    if (args.length !== 2 || !["guest", "protected"].includes(args[1])) usage();
    genRoute(args[0], args[1] as "guest" | "protected");
    break;
  case "model":
    genModel(args[0]);
    break;
  case "middleware":
    genMiddleware(args[0]);
    break;
  default:
    usage();
}
