# Architecture · S.ARAN OIL & AUTOPART ERP

## High-Level Diagram

```
┌─────────────────────────────────────┐
│  softcraft.co.th                    │
│  React App (Cloudflare Pages)       │
│  • TanStack Router (file-based)     │
│  • TanStack Query (server state)    │
│  • Zustand (client state)           │
│  • Axios + JWT interceptor          │
└──────────┬──────────────────────────┘
           │ HTTPS · JSON · JWT
           ▼
┌─────────────────────────────────────┐
│  api.softcraft.co.th                │
│  .NET 9 Web API (Render.com)        │
│  • Soomboon.Api (Controllers)       │
│  • Soomboon.Core (Domain)           │
│  • Soomboon.Infrastructure (EF)     │
└──────────┬──────────────────────────┘
           │ Npgsql
           ▼
┌─────────────────────────────────────┐
│  Supabase PostgreSQL (Tokyo)        │
│  • 21 tables                        │
│  • Identity tables                  │
│  • Daily backups                    │
└─────────────────────────────────────┘
```

## Layered Architecture (Backend)

### Soomboon.Api (Presentation)
- HTTP Controllers
- Request/Response DTOs
- Authentication middleware
- Swagger/OpenAPI
- CORS, exception handling

### Soomboon.Core (Domain)
- Entities (Branch, Product, Customer, etc.)
- Domain interfaces
- Common base classes
- **No dependencies** on infrastructure

### Soomboon.Infrastructure (Data)
- EF Core DbContext
- Repository implementations
- Identity stores
- External service integrations

### Soomboon.Tests
- Unit tests (xUnit)
- Integration tests
- Mocking with Moq

## Frontend Structure

```
web/src/
├── api/              REST API clients (Axios)
├── components/
│   ├── ui/           Reusable primitives (Button, Input, Field)
│   └── layout/       Page layouts (Sidebar, Topbar, AppShell)
├── features/         Feature modules (auth, dashboard, inventory, etc.)
│   └── <feature>/
│       ├── <Feature>Page.tsx
│       ├── components/
│       ├── hooks/
│       └── api/
├── lib/              Utilities (i18n, utils)
├── store/            Zustand stores (auth)
└── styles/           Global CSS + Tailwind
```

## Authentication Flow

```
1. User submits credentials → POST /api/auth/login
2. API validates with ASP.NET Identity
3. API issues JWT (60min) + Refresh Token (30d)
4. Frontend stores in Zustand (persisted to localStorage)
5. Subsequent requests attach Bearer JWT
6. On 401 → Auto logout / refresh token flow
```

## Data Flow Example: Create Sales Order

```
User clicks "Save SO"
  → React Hook Form validation (Zod schema)
  → TanStack Query mutation
  → POST /api/sales-orders
  → Controller → MediatR → Handler
  → DbContext.Add() + SaveChangesAsync()
  → Entity Framework → PostgreSQL
  → Response back to frontend
  → Cache invalidation → UI update
```

## Design Patterns

- **Repository Pattern** — abstract data access
- **CQRS-lite** with MediatR — separate command/query handlers
- **DTO Pattern** — separate API contracts from domain
- **Result Pattern** — explicit error handling
- **Specification Pattern** — composable query filters

## Tech Decisions

| Concern | Choice | Why |
|---------|--------|-----|
| ORM | EF Core 9 | Mature, LINQ-friendly, migrations |
| Auth | ASP.NET Identity + JWT | Built-in, enterprise-grade, stateless |
| Database | PostgreSQL on Supabase | Free tier, reliable, near-Thailand region |
| Frontend Lang | TypeScript | Type safety across stack |
| State | Zustand | Simpler than Redux, persist works |
| Server State | TanStack Query | De-facto for React, great DX |
| Forms | React Hook Form + Zod | Performance + schema validation |
| Routing | TanStack Router | File-based, type-safe |
| Styling | Tailwind 3.4 | Utility-first, fast iteration |
