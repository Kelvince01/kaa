"use client";

import type { IntlError } from "next-intl";

export const captureNextIntlError = (e: IntlError) => {
  console.error(e.message);
};
