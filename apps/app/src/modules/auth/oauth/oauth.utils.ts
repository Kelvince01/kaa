import type { OAuthConnection, SupportedOAuthProvider } from "./oauth.type";

/**
 * Check if a provider is supported
 */
export function isSupportedProvider(
  provider: string
): provider is SupportedOAuthProvider {
  return ["google", "microsoft"].includes(provider);
}

/**
 * Get OAuth provider configuration
 */
export function getProviderConfig(provider: SupportedOAuthProvider) {
  const configs = {
    google: {
      name: "google",
      displayName: "Google",
      icon: "🔍",
      color: "#4285f4",
      authUrl: "/auth/oauth/google",
    },
    microsoft: {
      name: "microsoft",
      displayName: "Microsoft",
      icon: "🪟",
      color: "#00a1f1",
      authUrl: "/auth/oauth/microsoft",
    },
  };

  return configs[provider];
}

/**
 * Get all supported providers
 */
export function getSupportedProviders() {
  return ["google", "microsoft"] as SupportedOAuthProvider[];
}

/**
 * Format connection date
 */
export function formatConnectionDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Get provider from connection
 */
export function getProviderFromConnection(connection: OAuthConnection) {
  return getProviderConfig(connection.provider as SupportedOAuthProvider);
}

/**
 * Check if user has any OAuth connections
 */
export function hasOAuthConnections(connections: OAuthConnection[]): boolean {
  return connections.length > 0;
}

/**
 * Get connection by provider
 */
export function getConnectionByProvider(
  connections: OAuthConnection[],
  provider: SupportedOAuthProvider
): OAuthConnection | undefined {
  return connections.find((conn) => conn.provider === provider);
}

/**
 * Check if provider is connected
 */
export function isProviderConnected(
  connections: OAuthConnection[],
  provider: SupportedOAuthProvider
): boolean {
  return connections.some((conn) => conn.provider === provider);
}

/**
 * Get connected providers
 */
export function getConnectedProviders(
  connections: OAuthConnection[]
): SupportedOAuthProvider[] {
  return connections
    .map((conn) => conn.provider)
    .filter((provider): provider is SupportedOAuthProvider =>
      isSupportedProvider(provider)
    );
}

/**
 * Get disconnected providers
 */
export function getDisconnectedProviders(
  connections: OAuthConnection[]
): SupportedOAuthProvider[] {
  const connectedProviders = getConnectedProviders(connections);
  return getSupportedProviders().filter(
    (provider) => !connectedProviders.includes(provider)
  );
}

/**
 * Generate OAuth state parameter for CSRF protection
 */
export function generateOAuthState(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Validate OAuth state parameter
 */
export function validateOAuthState(
  state: string,
  expectedState: string
): boolean {
  return state === expectedState;
}
