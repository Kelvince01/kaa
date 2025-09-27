// scripts/processor.cjs
"use strict";

module.exports = {
  // biome-ignore lint/correctness/noUnusedFunctionParameters: ignore
  extractCsrf(req, res, context, ee, next) {
    const rawCookie = res.headers["set-cookie"]?.[0] || "";
    context.vars.csrfCookie = rawCookie;
    // biome-ignore lint/performance/useTopLevelRegex: ignore
    const match = rawCookie.match(/csrf=([^;]+)/);
    context.vars.csrfToken = match ? match[1] : "";
    return next();
  },

  // biome-ignore lint/correctness/noUnusedFunctionParameters: ignore
  extractSessionCookie(req, res, context, ee, next) {
    const session = res.headers["set-cookie"]?.[0] || "";
    context.vars.sessionCookie = session;
    return next();
  },
};
