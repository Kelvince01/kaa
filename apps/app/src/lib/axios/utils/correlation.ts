const validPattern = /^[a-zA-Z0-9\-_]+$/;

export function generateCorrelationId(): string {
  if (window?.crypto?.getRandomValues) {
    // Browser environment with crypto support
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
    // biome-ignore lint/style/noUselessElse: false positive
  } else {
    // Fallback for environments without crypto.getRandomValues
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2);
    return `${timestamp}-${randomPart}`;
  }
}

export function extractCorrelationId(
  headers: Record<string, string>
): string | undefined {
  return (
    headers["x-correlation-id"] ||
    headers["X-Correlation-ID"] ||
    headers["correlation-id"] ||
    undefined
  );
}

export function isValidCorrelationId(id: string): boolean {
  if (!id || typeof id !== "string") return false;

  // Allow alphanumeric, hyphens, and underscores
  return validPattern.test(id) && id.length >= 8 && id.length <= 64;
}
