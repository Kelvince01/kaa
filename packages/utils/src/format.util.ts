/**
 * Format numbers for display
 */
export const formatNumber = (num: number): string =>
  new Intl.NumberFormat("en-KE").format(Math.round(num));
