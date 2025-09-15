import Elysia from "elysia";

export const publicPath = "public";

export const indexHtml = new Response(Bun.file(`${publicPath}/index.html`), {
  headers: { "Content-Type": "text/html; charset=utf-8" },
});

const sitePlugin = new Elysia().get("/", () => {
  return indexHtml;
});

export default sitePlugin;
