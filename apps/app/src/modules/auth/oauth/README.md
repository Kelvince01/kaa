# OAuth Authentication Module

This module provides OAuth authentication functionality for connecting and managing social media accounts (Google, Microsoft) in the frontend application.

## Features

- **OAuth Connections Management**: View, connect, and disconnect OAuth accounts
- **Multiple Providers**: Support for Google and Microsoft OAuth
- **React Query Integration**: Optimistic updates and caching
- **Type Safety**: Full TypeScript support with proper type definitions
- **Component Library**: Pre-built UI components for common OAuth operations
- **Utility Functions**: Helper functions for OAuth operations

## API Endpoints

The module connects to these backend API endpoints:

- `GET /auth/oauth/connections` - Get user's OAuth connections
- `POST /auth/oauth/link` - Link OAuth account to current user
- `POST /auth/oauth/unlink` - Unlink OAuth account from current user
- `GET /auth/oauth/google` - Initiate Google OAuth flow
- `GET /auth/oauth/microsoft` - Initiate Microsoft OAuth flow

## Components

### OAuthConnections

A complete OAuth connections management interface showing all providers and their connection status.

```tsx
import { OAuthConnections } from "@/modules/auth/oauth";

function AccountSettings() {
  return (
    <div>
      <h1>Account Settings</h1>
      <OAuthConnections />
    </div>
  );
}
```

### OAuthConnectButton

A button to initiate OAuth connection for a specific provider.

```tsx
import { OAuthConnectButton } from "@/modules/auth/oauth";

function LoginPage() {
  return (
    <div>
      <OAuthConnectButton provider="google" />
      <OAuthConnectButton provider="microsoft" />
    </div>
  );
}
```

### OAuthProviderStatus

Shows the connection status for a specific OAuth provider with connect/disconnect actions.

```tsx
import { OAuthProviderStatus, useOAuthProviders } from "@/modules/auth/oauth";

function SecuritySettings() {
  const { providers } = useOAuthProviders();
  
  return (
    <div>
      {providers.map((provider) => (
        <OAuthProviderStatus key={provider.name} provider={provider} />
      ))}
    </div>
  );
}
```

## Hooks

### useOAuthConnections

Fetch user's OAuth connections.

```tsx
import { useOAuthConnections } from "@/modules/auth/oauth";

function MyComponent() {
  const { data, isLoading, error } = useOAuthConnections();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading connections</div>;
  
  return (
    <div>
      {data?.connections?.map((connection) => (
        <div key={connection.id}>
          {connection.provider} - {connection.profile.email}
        </div>
      ))}
    </div>
  );
}
```

### useLinkOAuthAccount

Link an OAuth account to the current user.

```tsx
import { useLinkOAuthAccount } from "@/modules/auth/oauth";

function MyComponent() {
  const { mutate: linkAccount, isPending } = useLinkOAuthAccount();
  
  const handleLink = () => {
    linkAccount({
      provider: "google",
      providerUserId: "123",
      accessToken: "token",
      refreshToken: "refresh",
      profile: {
        name: "John Doe",
        email: "john@example.com",
      },
    });
  };
  
  return (
    <button onClick={handleLink} disabled={isPending}>
      {isPending ? "Linking..." : "Link Account"}
    </button>
  );
}
```

### useUnlinkOAuthAccount

Unlink an OAuth account from the current user.

```tsx
import { useUnlinkOAuthAccount } from "@/modules/auth/oauth";

function MyComponent() {
  const { mutate: unlinkAccount, isPending } = useUnlinkOAuthAccount();
  
  const handleUnlink = () => {
    unlinkAccount({ provider: "google" });
  };
  
  return (
    <button onClick={handleUnlink} disabled={isPending}>
      {isPending ? "Unlinking..." : "Unlink"}
    </button>
  );
}
```

### useOAuthProviders

Get OAuth providers with their connection status.

```tsx
import { useOAuthProviders } from "@/modules/auth/oauth";

function MyComponent() {
  const { providers, isLoading, connections } = useOAuthProviders();
  
  return (
    <div>
      {providers.map((provider) => (
        <div key={provider.name}>
          {provider.displayName}: {provider.isConnected ? "Connected" : "Not Connected"}
        </div>
      ))}
    </div>
  );
}
```

### useInitiateOAuth

Initiate OAuth flow for a provider.

```tsx
import { useInitiateOAuth } from "@/modules/auth/oauth";

function MyComponent() {
  const { initiateOAuth } = useInitiateOAuth();
  
  return (
    <div>
      <button onClick={() => initiateOAuth("google")}>
        Sign in with Google
      </button>
      <button onClick={() => initiateOAuth("microsoft")}>
        Sign in with Microsoft
      </button>
    </div>
  );
}
```

## Utility Functions

```tsx
import {
  isSupportedProvider,
  getProviderConfig,
  isProviderConnected,
  getConnectedProviders,
} from "@/modules/auth/oauth";

// Check if provider is supported
if (isSupportedProvider("google")) {
  // Provider is supported
}

// Get provider configuration
const config = getProviderConfig("google");
console.log(config.displayName); // "Google"

// Check if provider is connected
const isConnected = isProviderConnected(connections, "google");

// Get all connected providers
const connectedProviders = getConnectedProviders(connections);
```

## Types

```tsx
import type {
  OAuthConnection,
  OAuthProvider,
  SupportedOAuthProvider,
  LinkOAuthRequest,
  UnlinkOAuthRequest,
} from "@/modules/auth/oauth";
```

## Error Handling

The module includes comprehensive error handling with user-friendly toast notifications:

- Connection errors are caught and displayed
- Loading states are managed automatically
- Optimistic updates provide immediate UI feedback
- Query invalidation ensures data consistency

## Security Considerations

- OAuth state parameters are generated for CSRF protection
- Sensitive tokens (access/refresh) are not exposed in the UI
- All API calls are authenticated with user session
- Provider validation prevents invalid OAuth flows

## Usage Examples

See the `examples/` directory for complete usage examples:

- `AccountSettings.example.tsx` - OAuth connections in account settings
- `LoginWithOAuth.example.tsx` - OAuth login buttons in login form
