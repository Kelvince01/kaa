import Elysia from "elysia";

export const publicPath = "public";

// biome-ignore lint/correctness/noUndeclaredVariables: false positive
export const indexHtml = new Response(Bun.file(`${publicPath}/index.html`), {
  headers: { "Content-Type": "text/html; charset=utf-8" },
});

const sitePlugin = new Elysia().get("/", () => indexHtml);

export default sitePlugin;
