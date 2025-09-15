// import Elysia from "elysia";

// Input sanitization middleware
// export const sanitizePlugin = new Elysia({ name: "sanitize" }).onRequest(
//   ({ body }) => {
//     if (body && typeof body === "object") {
//       sanitizeObject(body);
//     }
//   }
// );

function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      const value = obj[key];

      if (typeof value === "string") {
        // Basic XSS prevention
        obj[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+\s*=/gi, "");
      } else if (typeof value === "object" && value !== null) {
        sanitizeObject(value);
      }
    }
  }
}

// MongoDB injection prevention
// export const mongoSanitizePlugin = new Elysia({
//   name: "mongo-sanitize",
// }).onRequest(({ body, query, params }) => {
//   for (const obj of [body, query, params]) {
//     if (obj && typeof obj === "object") {
//       sanitizeMongoQuery(obj);
//     }
//   }
// });

function sanitizeMongoQuery(obj: any): void {
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      const value = obj[key];

      // Remove MongoDB operators from user input
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
        continue;
      }

      if (typeof value === "object" && value !== null) {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === "object") {
              sanitizeMongoQuery(item);
            }
          }
        } else {
          sanitizeMongoQuery(value);
        }
      }
    }
  }
}
