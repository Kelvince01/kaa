# Passkey Authentication Module

This module provides a complete implementation of WebAuthn/Passkey authentication for the KAA SaaS application.

## Features

- 🔐 **Passwordless Authentication**: Users can sign in using biometrics (Face ID, Touch ID) or device PIN
- 🛡️ **Enhanced Security**: Resistant to phishing, credential stuffing, and password breaches
- 📱 **Cross-Platform Support**: Works on iOS, Android, macOS, Windows, and more
- 🔄 **Device Sync**: Passkeys can be synced across devices via platform services (iCloud Keychain, Google Password Manager)
- 🎨 **Ready-to-Use Components**: Pre-built React components for enrollment and authentication

## Installation

The required dependencies should already be installed:

```bash
npm install @simplewebauthn/browser @simplewebauthn/types date-fns
```

## Directory Structure

```
passkey/
├── components/
│   ├── PasskeyEnrollButton.tsx    # Button component for passkey enrollment
│   ├── PasskeyLoginButton.tsx     # Button component for passkey authentication
│   └── PasskeyManager.tsx         # Full management interface for passkeys
├── examples/
│   ├── LoginWithPasskey.example.tsx    # Example login page integration
│   └── AccountSettings.example.tsx     # Example settings page integration
├── passkey.type.ts                # TypeScript type definitions
├── passkey.service.ts             # API service functions
├── passkey.utils.ts               # WebAuthn utility functions
├── passkey.queries.ts             # React Query hooks
├── index.ts                       # Module exports
└── README.md                      # This file
```

## Quick Start

### 1. Enable Passkey Login on Your Login Page

```tsx
import { PasskeyLoginButton } from '@/modules/auth/passkey';

function LoginPage() {
  const [email, setEmail] = useState('');
  
  return (
    <form>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      
      {/* Show passkey button when email is valid */}
      {email && (
        <PasskeyLoginButton 
          email={email}
          onSuccess={() => console.log('Logged in!')}
        />
      )}
      
      {/* Traditional password login */}
      <input type="password" />
      <button type="submit">Sign in with Password</button>
    </form>
  );
}
```

### 2. Add Passkey Enrollment to User Settings

```tsx
import { PasskeyManager } from '@/modules/auth/passkey';

function SecuritySettings() {
  return (
    <div>
      <h2>Security Settings</h2>
      <PasskeyManager />
    </div>
  );
}
```

### 3. Simple Enrollment Button

```tsx
import { PasskeyEnrollButton } from '@/modules/auth/passkey';

function Dashboard() {
  return (
    <PasskeyEnrollButton 
      onSuccess={() => console.log('Passkey created!')}
    />
  );
}
```

## API Reference

### Components

#### `<PasskeyEnrollButton />`

Button component that handles the complete passkey enrollment flow.

**Props:**

- `onSuccess?: () => void` - Callback when enrollment succeeds
- `className?: string` - Additional CSS classes
- `variant?: "default" | "outline" | "secondary" | "ghost" | "link"` - Button variant
- `size?: "default" | "sm" | "lg" | "icon"` - Button size

#### `<PasskeyLoginButton />`

Button component for passkey authentication.

**Props:**

- `email: string` - User's email address (required)
- `onSuccess?: () => void` - Callback when authentication succeeds
- `className?: string` - Additional CSS classes
- `variant?: "default" | "outline" | "secondary" | "ghost" | "link"` - Button variant
- `size?: "default" | "sm" | "lg" | "icon"` - Button size
- `fullWidth?: boolean` - Make button full width

#### `<PasskeyManager />`

Complete passkey management interface with list, add, and delete functionality.

### Hooks

#### `useEnrollPasskey()`

Hook for enrolling a new passkey.

```tsx
const enrollPasskey = useEnrollPasskey();

const handleEnroll = async () => {
  try {
    await enrollPasskey.mutateAsync();
    console.log('Passkey enrolled!');
  } catch (error) {
    console.error('Enrollment failed:', error);
  }
};
```

#### `useVerifyPasskey()`

Hook for authenticating with a passkey.

```tsx
const verifyPasskey = useVerifyPasskey();

const handleLogin = async (email: string) => {
  try {
    await verifyPasskey.mutateAsync(email);
    console.log('Authenticated!');
  } catch (error) {
    console.error('Authentication failed:', error);
  }
};
```

#### `useHasPasskey(email: string)`

Hook to check if a user has a passkey.

```tsx
const { data: hasPasskey, isLoading } = useHasPasskey('user@example.com');

if (hasPasskey) {
  // Show passkey login option
}
```

#### `useListPasskeys(userId: string)`

Hook to get all passkeys for a user.

```tsx
const { data, isLoading } = useListPasskeys(userId);

// data.passkeys contains array of passkeys
```

#### `useDeletePasskey()`

Hook to delete a passkey.

```tsx
const deletePasskey = useDeletePasskey();

const handleDelete = async (passkeyId: string) => {
  await deletePasskey.mutateAsync(passkeyId);
};
```

### Utilities

#### `passkeyUtils.isSupported()`

Check if the browser supports WebAuthn.

```tsx
if (passkeyUtils.isSupported()) {
  // Show passkey options
}
```

#### `passkeyUtils.canCreatePlatformAuthenticator()`

Check if the device can create platform authenticators.

```tsx
const canCreate = await passkeyUtils.canCreatePlatformAuthenticator();
if (canCreate) {
  // Device supports creating passkeys
}
```

#### `passkeyUtils.getDeviceName()`

Get a user-friendly name for the current device.

```tsx
const deviceName = passkeyUtils.getDeviceName(); // "iPhone", "Mac", "Windows PC", etc.
```

## Server-Side Requirements

The passkey module expects the following API endpoints to be available:

- `POST /auth/passkey/enroll` - Create a new passkey
- `GET /auth/passkey/:userId` - Get user's passkey
- `GET /auth/passkey/user/:email` - Get passkey by email
- `PATCH /auth/passkey/:passkeyId` - Update passkey counter
- `DELETE /auth/passkey/:passkeyId/:userId` - Delete a passkey
- `POST /auth/passkey/enroll/options` - Get enrollment options
- `POST /auth/passkey/verify/options` - Get verification options
- `POST /auth/passkey/process/enroll` - Process enrollment response
- `POST /auth/passkey/process/verify` - Process verification response

These endpoints are already implemented in the `api` service.

## Browser Support

Passkeys are supported on:

- ✅ Chrome 67+ (Desktop & Mobile)
- ✅ Safari 14+ (macOS & iOS)
- ✅ Edge 79+
- ✅ Firefox 60+
- ✅ Opera 54+

## Security Considerations

1. **HTTPS Required**: WebAuthn only works over HTTPS (or localhost for development)
2. **Relying Party ID**: Must match your domain (e.g., "example.com")
3. **User Verification**: Always set to "preferred" or "required"
4. **Backup Methods**: Always provide alternative authentication methods

## Troubleshooting

### "WebAuthn is not supported"

- Ensure you're using HTTPS
- Check browser compatibility
- Update to the latest browser version

### "No passkey found for this account"

- User hasn't enrolled a passkey yet
- Direct them to security settings to create one

### "The passkey creation was cancelled"

- User cancelled the browser prompt
- Device may not support platform authenticators

### "Failed to create passkey"

- Check network connection
- Verify API endpoints are accessible
- Check browser console for detailed errors

## Examples

See the `examples/` directory for complete integration examples:

1. **LoginWithPasskey.example.tsx**: Shows how to integrate passkey authentication into a login page alongside traditional password login
2. **AccountSettings.example.tsx**: Demonstrates passkey management in user account settings

## Contributing

When adding new features to the passkey module:

1. Update type definitions in `passkey.type.ts`
2. Add service functions in `passkey.service.ts`
3. Create React Query hooks in `passkey.queries.ts`
4. Export new items in `index.ts`
5. Update this README with documentation

## License

This module is part of the KAA SaaS project.
