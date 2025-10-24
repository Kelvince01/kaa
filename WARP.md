# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Kaa is an AI-powered rental property management platform for the Kenyan market, built as a Turborepo monorepo with multiple apps and shared packages. The stack uses **Bun**, **MongoDB**, **Elysia**, **Next.js**, **React Native/Expo**, and **TypeScript**.

## Development Commands

### Installation & Setup

```bash
bun install
```

### Development

```bash
# Start all apps in development
bun run dev

# Start specific apps
bun run dev:web      # Next.js web app (port 3000)
bun run dev:app      # Next.js dashboard app (default port)
bun run dev:api      # Elysia API (watch mode)
bun run dev:docs     # Fumadocs documentation (port 4000)
```

### Building

```bash
# Build all apps
bun run build

# Build specific workspace (from root)
turbo run build --filter=@kaa/api
turbo run build --filter=@kaa/app
```

### Linting & Formatting

```bash
# Lint all packages
bun run lint

# Format code with Biome
bun run format

# Check code quality with oxlint
bun run check

# Fix linting issues with Ultracite
bunx ultracite fix
```

### Type Checking

```bash
# Check types across all packages
bun run check-types

# Check types for specific app (from app directory)
cd apps/api && bun run check-types
```

### API-Specific Commands

```bash
cd apps/api

# Development with hot reload
bun run dev-hot

# Build optimized bundle
bun run build

# Compile standalone binary
bun run compile

# Database seeding
bun run seed
bun run seed:rbac

# Load testing
bun run loadtest:login
bun run artillery:login
```

### Testing

```bash
# For apps/app (Next.js with Vitest)
cd apps/app
bun run test              # Run tests
bun run test:ui           # Run tests with UI
bun run test:coverage     # Run with coverage

# For apps/tfml (TensorFlow ML service)
cd apps/tfml
bun test
```

## Architecture

### Monorepo Structure

**Apps** (in `apps/`):

- **`api`**: Elysia backend API server with MongoDB/Mongoose
- **`app`**: Next.js dashboard application (main property management UI)
- **`web`**: Next.js marketing/public website
- **`docs`**: Fumadocs-based documentation site
- **`tfml`**: TensorFlow machine learning service for AI features

**Packages** (in `packages/`):

- **`models`**: Mongoose schemas and TypeScript types (shared data models)
- **`schemas`**: Zod validation schemas
- **`services`**: Business logic services (property, auth, payments, etc.)
- **`ui`**: Shared React components (shadcn/ui based)
- **`config`**: Environment configuration
- **`utils`**: Utility functions
- **`email`**: Email templates and services
- **`ai`**: AI/ML integration utilities
- **`communications`**: SMS, notifications, video calling
- **`desktop-client`**: Desktop app client
- **`tiptap`**: Rich text editor components
- Other: `blockchain`, `constants`, `documents`, `encryption`, `location`, `tus`

**Tooling** (in `tooling/`):

- **`@kaa/tsconfig`**: Shared TypeScript configurations

### Database Architecture

- **Database**: MongoDB with Mongoose ODM
- **Connection**: Primary write connection + optional read replica
- **Models Location**: `packages/models/src/*.model.ts`
- **Key Collections**:
  - Property, Unit, User, Tenant, Landlord
  - Contract, Payment, Financial records
  - Messages, Notifications, SMS, Email
  - Application, Booking, Maintenance, Work Orders
  - Review, Amenity, Template, Document
  - Virtual Tours, IoT devices, Analytics

All models follow a consistent pattern:

- Timestamps (createdAt, updatedAt)
- Soft deletes with `deletedAt` field
- Reference relationships via ObjectId
- Embedded subdocuments for complex structures

### API Architecture (Elysia)

The API (`apps/api`) is organized by feature modules in `src/features/`:

- Each feature has its own controller, schema, and sometimes service
- Controllers use Elysia decorators for routing
- Middleware: authentication, RBAC, rate limiting, security (helmet, XSS)
- Plugins: JWT, CORS, OpenAPI/Swagger, logging, metrics (Prometheus)
- Database setup: `src/database/mongoose.setup.ts`
- Main entry: `src/index.ts` → `src/app.ts`

Key feature modules:

- `auth/`: Authentication, sessions, MFA, passkeys, OAuth
- `properties/`: Property CRUD, search, amenities, units, inspections
- `users/`: User management (tenants, landlords, admins)
- `payments/`: Stripe, M-Pesa, payment methods, wallets
- `contracts/`: Rental contracts, amendments, renewals
- `comms/`: Messages, notifications, SMS, emails, video calling
- `rbac/`: Role-based access control
- `analytics/`: Property analytics and market intelligence
- `documents/`: Document management and legal documents
- `templates/`: Email/document templates
- `virtual-tours/`: Virtual property tours

### Frontend Architecture (Next.js)

**`apps/app`** (main dashboard):

- **Framework**: Next.js 16+ with React 19, TailwindCSS 4, shadcn/ui
- **State**: Zustand for global state, React Query (TanStack Query) for server state
- **Forms**: React Hook Form with Zod validation
- **Routing**: Next.js App Router with file-based routing
- **Modules** (`src/modules/`): Feature-based organization
  - `properties/`, `units/`, `tenants/`, `contracts/`, `payments/`
  - `auth/`, `users/`, `rbac/`, `files/`, `virtual-tours/`
- **Rich Text**: BlockNote editor (custom components in `src/components/common/blocknote/`)
- **Maps**: Google Maps, Mapbox, Leaflet integration
- **Internationalization**: next-intl for i18n support

### Key Patterns

1. **Workspace Dependencies**: Use `workspace:*` for internal packages
2. **Type Safety**: Shared types from `@kaa/models`, Zod schemas from `@kaa/schemas`
3. **Service Layer**: Business logic in `@kaa/services`, consumed by API controllers
4. **Code Quality**: Enforced by Biome (linting/formatting) and Ultracite (AI-friendly strict rules)
5. **Conventional Commits**: Use `git cz` (commitizen) instead of `git commit`
6. **Catalog Dependencies**: Shared dependency versions via workspace catalog in root `package.json`

### Environment Configuration

- `.env` files required for each app (not committed to git)
- Turborepo `globalEnv` in `turbo.json` defines shared env vars
- Use `@kaa/config` package for centralized config access
- Key vars: `MONGODB_URI`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`, Stripe/payment keys

### AI/ML Features

The `apps/tfml` service provides TensorFlow-based features:

- Property price prediction
- Sentiment analysis
- Document classification
- Training data pipeline
- Model deployment and inference
- Runs as separate Elysia service with BullMQ for job queuing

### Code Quality & Conventions

This project uses **Ultracite** (Biome-based) for strict code quality:

- Comprehensive accessibility (a11y) checks
- React/JSX best practices enforcement
- TypeScript strictness (no `any`, no enums, no namespaces)
- Mandatory error handling patterns
- Cognitive complexity limits
- See `.kiro/steering/ruler_cursor_instructions.md` for full ruleset

**Key conventions**:

- Use `for...of` instead of `Array.forEach`
- Arrow functions preferred over function expressions
- Template literals for string interpolation
- Export types with `export type`
- Import types with `import type`
- No parameter properties in constructors
- Explicit enum member values
- Comprehensive JSDoc for complex functions

### Database Migrations & Seeding

- No formal migration system (MongoDB is schemaless)
- Seed scripts in `apps/api/src/scripts/`:
  - `seed/index.ts` for general seeding
  - `seeds/rbac/index.ts` for RBAC permissions/roles
- Run from API directory: `bun run seed`

### Testing Strategy

- **Frontend**: Vitest with React Testing Library (`apps/app`)
- **Backend**: Bun test (`apps/tfml`)
- **Integration**: Supertest for API testing
- Test files colocated with source or in `__tests__` directories

### Security

- JWT-based authentication with refresh tokens
- RBAC system with granular permissions
- Rate limiting (Redis-backed)
- Helmet for security headers
- XSS protection
- CSRF tokens for mutations
- Passkey/WebAuthn support
- 2FA with TOTP and recovery codes

### Payments Integration

- **Stripe**: Subscriptions, one-time payments
- **M-Pesa**: Mobile money integration (Kenyan market)
- Wallet system for internal transactions
- Recurring payment automation
- Payment method management

### Real-Time Features

- WebSocket support via Elysia
- BullMQ for background job processing (Redis)
- Cron jobs via `@elysiajs/cron`
- Push notifications (web-push)
- Video calling (WebRTC)

## Common Workflows

### Adding a New Feature Module

1. Create model in `packages/models/src/`
2. Create Zod schema in `packages/schemas/src/`
3. Create service in `packages/services/src/`
4. Create API controller in `apps/api/src/features/`
5. Create frontend module in `apps/app/src/modules/`

### Debugging MongoDB Queries

Enable Mongoose debug mode in `apps/api/src/database/mongoose.setup.ts`:

```typescript
mongoose.set("debug", true);
```

### Running Load Tests

```bash
cd apps/api
bun run loadtest:login       # Autocannon-based load test
bun run artillery:login      # Artillery-based load test
```

### Viewing API Documentation

When API is running, visit:

- OpenAPI/Swagger: `http://localhost:PORT/swagger` (check `apps/api` for port)
- Bull Board (job queue): Configured via `@bull-board/elysia`

## Troubleshooting

- **MongoDB connection issues**: Check `MONGODB_URI` in `.env`, ensure MongoDB is running
- **Port conflicts**: Each app uses different ports (web:3000, docs:4000, API varies)
- **Type errors across workspaces**: Run `bun run check-types` from root to find issues
- **Biome/Ultracite errors**: Run `bunx ultracite fix` or `bun run format` to auto-fix
- **Missing dependencies**: Run `bun install` from root to sync workspace dependencies
