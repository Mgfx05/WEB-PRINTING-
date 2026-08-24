# ERB Cloud Printing Platform

> **Production-quality on-demand printing platform** connecting customers with local print shops.

## Architecture Overview

```
Customer → Web (Next.js 15) → API → PostgreSQL
                                  → Object Storage
                                  → Redis / BullMQ Queue
                                         ↓
                                   Print Worker
                                         ↓
                                   Print Agent (shop-local)
                                         ↓
                                      Printer
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 App Router, React, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Auth | NextAuth.js v5 |
| Database | PostgreSQL 16, Prisma ORM |
| Queue | BullMQ + Redis 7 |
| Storage | Local FS (dev) → S3-compatible (prod) |
| Worker | Standalone Node.js process |
| Agent | Standalone Node.js HTTP server |
| Monorepo | Turborepo + pnpm |
| Testing | Vitest, Playwright |

## Project Structure

```
erb/
├── apps/
│   ├── web/            ← Next.js web application
│   └── print-worker/   ← BullMQ print job worker
├── packages/
│   ├── database/       ← Prisma schema + migrations
│   ├── types/          ← Shared TypeScript types
│   ├── validation/     ← Shared Zod schemas
│   └── config/         ← Shared environment config
├── docker/             ← Docker Compose configs
├── docs/               ← Architecture docs, ADRs
└── tests/              ← E2E and concurrency tests
```

## Quick Start (Development)

### Prerequisites
- Node.js >= 20
- pnpm >= 9
- Docker Desktop

### 1. Clone and install
```bash
git clone <repo>
cd erb
pnpm install
```

### 2. Environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start infrastructure
```bash
docker compose -f docker/docker-compose.yml up -d
```

### 4. Database setup
```bash
pnpm db:migrate
pnpm db:seed
```

### 5. Start development
```bash
pnpm dev
```

- Web app: http://localhost:3000
- Prisma Studio: `pnpm db:studio`

## User Roles

| Role | Access |
|---|---|
| `CUSTOMER` | Upload, order, track |
| `SHOP_OWNER` | Dashboard, printers, orders |
| `ADMIN` | System-wide management |

## Order State Machine

```
CREATED → UPLOADED → WAITING_FOR_SHOP → ACCEPTED → QUEUED → PRINTING → COMPLETED
                                      → REJECTED
                                                                       → FAILED → QUEUED (retry)
any → CANCELLED
```

## Print Job Architecture

```
Order Created
    ↓
Print Job Persisted (DB)
    ↓
Job Queued (BullMQ/Redis)
    ↓
Worker Atomically Claims Job
    ↓
Worker Validates Capabilities
    ↓
Worker Sends to Print Agent
    ↓
Agent Downloads Document
    ↓
Agent Prints to Physical Printer
    ↓
Worker Updates Status → COMPLETED
    ↓
Customer Notified (SSE)
```

## Concurrency Guarantees

- Every document has a unique UUID storage key
- Every order has a unique UUID + human-readable ERB-XXXXXX number
- Every print job uses BullMQ atomic claiming (only one worker ever processes a job)
- DB transactions with row-level locking prevent duplicate state transitions
- Idempotency keys on order creation prevent double-submission

## Documentation

- [Architecture Overview](docs/architecture/overview.md)
- [API Reference](docs/api/README.md)
- [Database Schema](docs/architecture/database.md)
- [Print Agent](docs/printing/agent.md)
- [Deployment](docs/deployment.md)

## Testing

```bash
pnpm test:unit          # Vitest unit tests
pnpm test:integration   # DB + queue integration tests
pnpm test:e2e           # Playwright end-to-end tests
```

## License

Private — ERB Cloud Printing Platform
