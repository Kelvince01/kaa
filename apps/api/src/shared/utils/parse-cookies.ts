export function parseCookies(
  cookieHeader: string | null | undefined
): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(cookieHeader.split("; ").map((s) => s.split("=")));
}
