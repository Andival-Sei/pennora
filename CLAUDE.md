# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm dev:turbo        # Start with Turbopack (faster)

# Quality checks
pnpm lint             # ESLint check
pnpm lint:fix         # Auto-fix ESLint issues
pnpm format           # Format with Prettier
pnpm format:check     # Check formatting
pnpm check:all        # Format + lint + typecheck + build

# Testing (Vitest)
pnpm test             # Run tests in watch mode
pnpm test:ui          # Run with UI dashboard
pnpm test:coverage    # Generate coverage report
pnpm vitest path/to/file.test.ts  # Run single test file

# Build
pnpm build            # Production build
ANALYZE=true pnpm build  # Build with bundle analyzer
```

## Architecture

**Pennora** is a personal/family budget tracker with offline-first architecture.

### Tech Stack

- **Framework**: Next.js 16 + React 19 + TypeScript
- **Database**: Supabase (PostgreSQL + Auth) — Project ID: `olndoyixsjlkcwmgzwkr`
- **Offline storage**: IndexedDB via Dexie with sync queue
- **State**: TanStack Query (server state) + Zustand (client state)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS 4 + Framer Motion
- **Forms**: React Hook Form + Zod validation
- **i18n**: next-intl (RU/EN)

### Key Directories

```
app/           # Next.js App Router
  (auth)/      # Auth routes (login, register)
  (main)/      # Main app routes (dashboard, budgets)
lib/
  db/          # Supabase client + IndexedDB setup
  query/       # TanStack Query hooks and keys
  sync/        # Offline sync manager
  hooks/       # Custom React hooks
  stores/      # Zustand stores
  services/    # Business logic services
  validations/ # Zod schemas
components/
  ui/          # shadcn/ui components
  features/    # Feature-specific components
supabase/
  migrations/  # SQL migrations
```

### Data Flow

1. **Online**: Supabase → TanStack Query cache → Components
2. **Offline**: IndexedDB (Dexie) stores data + sync queue
3. **Sync**: SyncManager processes queue when online, handles conflicts

## Code Conventions

- Use **pnpm** (not npm)
- Prefer **interfaces** over types
- Avoid **enums** — use maps instead
- Use **functional/declarative patterns** — avoid classes
- Minimize `'use client'` — favor React Server Components
- Wrap client components in Suspense with fallback
- UI must be **adaptive, accessible, and animated** (Framer Motion)
- Use lowercase with dashes for directories (e.g., `components/auth-wizard`)
- Favor named exports for components

## Testing

- Framework: Vitest with Testing Library
- Setup file: `__tests__/setup.ts` (global mocks for localStorage, next/navigation, etc.)
- Custom render: `__tests__/utils/test-utils.tsx` (wraps with providers)
- Use `@vitest-environment node` directive for server-side utility tests
- Coverage threshold: 25% (targeting 70%)

## Git Workflow

- **main** — production, **develop** — staging
- Feature branches: `feature/*`, `fix/*` → PR to develop
- Pre-commit: Husky runs ESLint + Prettier via lint-staged
- Releases: semantic-release on merge to develop (Conventional Commits)

## MCP Tools

- Apply Supabase migrations with Supabase MCP (project ID: `olndoyixsjlkcwmgzwkr`)
- Use Vitest MCP for test operations
