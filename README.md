# ERB Cloud Printing Platform

> **Production-grade on-demand cloud printing infrastructure** connecting customers with local, verified print shops for seamless PDF printing, real-time job queuing, and physical printer dispatch.

---

## Table of Contents

- [Overview & Capabilities](#overview--capabilities)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Monorepo Project Structure](#monorepo-project-structure)
- [Local Development Setup](#local-development-setup)
  - [Prerequisites](#prerequisites)
  - [1. Clone & Install Dependencies](#1-clone--install-dependencies)
  - [2. Environment Configuration](#2-environment-configuration)
  - [3. Start Infrastructure (Docker Compose)](#3-start-infrastructure-docker-compose)
  - [4. Database Migration & Seeding](#4-database-migration--seeding)
  - [5. Run Development Servers](#5-run-development-servers)
- [Pre-Seeded Test Accounts](#pre-seeded-test-accounts)
- [Core Workflows & Features](#core-workflows--features)
  - [1. The 4-Step Print Wizard](#1-the-4-step-print-wizard)
  - [2. PDF Upload & Verification Subsystem](#2-pdf-upload--verification-subsystem)
  - [3. Dynamic Pricing Calculation Engine](#3-dynamic-pricing-calculation-engine)
  - [4. Order State Machine](#4-order-state-machine)
  - [5. Print Worker & Local Agent Dispatch](#5-print-worker--local-agent-dispatch)
- [Role-Based Portals](#role-based-portals)
- [Troubleshooting & FAQs](#troubleshooting--faqs)
- [CLI Scripts Reference](#cli-scripts-reference)

---

## Overview & Capabilities

ERB bridges the gap between digital documents and physical print shops. Instead of emailing files, transferring USB drives, or dealing with formatting mismatches at a counter, ERB provides:

1. **Instant PDF Upload & Analysis**: Validates PDF file integrity, extracts binary page counts, calculates SHA-256 checksums, and encrypts storage keys.
2. **Deep Print Customization**: Configure color mode (B&W or Color), duplex (simplex, long-edge, short-edge), paper sizes (A4, A3, Letter, Legal), N-up sheet scaling (1, 2, 4, 6, 8, 9, 16 per page), quality, copies, and custom page ranges.
3. **Dynamic Real-Time Pricing**: Instant price calculations factoring in base per-page rates, paper size multipliers, duplex adjustments, and volume discount tiers.
4. **Autonomous Job Dispatch**: Background worker (BullMQ + Redis) pulls accepted orders, performs printer capability matching, and dispatches print jobs to local print shop agents with retry policies.
5. **Live Tracking via Server-Sent Events (SSE)**: Customers see real-time updates as their order moves from `CREATED` to `PRINTING` and `COMPLETED`.

---

## System Architecture

```
                                  ┌────────────────────────┐
                                  │      Web Browser       │
                                  │  (Customer/Shop/Admin) │
                                  └───────────┬────────────┘
                                              │ HTTP / SSE / REST
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Next.js 15 App Router                                 │
│                                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────────┐  │
│  │   Customer Portal    │  │  Shop Owner Portal   │  │     Admin Portal      │  │
│  │  (/upload, /orders)  │  │   (/shop/dashboard)  │  │   (/admin/dashboard)  │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └───────────┬───────────┘  │
│             │                         │                          │              │
│             └─────────────────┬───────┴──────────────────────────┘              │
│                               ▼                                                 │
│                     API Route Handlers (/api/v1/*)                              │
│                                                                                 │
│      ┌─────────────────────┬──────────────────────┬──────────────────────┐      │
│      │ Document Upload API │  Pricing Engine API  │    Orders API / SSE  │      │
│      └──────────┬──────────┴──────────┬───────────┴──────────┬───────────┘      │
└─────────────────┼─────────────────────┼──────────────────────┼──────────────────┘
                  │                     │                      │
       ┌──────────┴──────────┐          │           ┌──────────┴──────────┐
       │   Storage Service   │          │           │     Prisma Client   │
       │ (Local FS / S3 Bucket)         │           └──────────┬──────────┘
       └──────────┬──────────┘          │                      │
                  │                     │                      ▼
                  ▼                     │           ┌─────────────────────┐
       ┌─────────────────────┐          │           │    PostgreSQL 16    │
       │   File Storage      │          │           │   (Database & ACID) │
       │ (./uploads/...pdf)  │          │           └─────────────────────┘
       └─────────────────────┘          │
                                        ▼
                            ┌───────────────────────┐
                            │    Redis 7 / BullMQ   │
                            │   (Print Job Queue)   │
                            └───────────┬───────────┘
                                        │ Atomic Job Claim
                                        ▼
                            ┌───────────────────────┐
                            │     Print Worker      │
                            │  (Daemon Processor)   │
                            └───────────┬───────────┘
                                        │ Capability Match & Dispatch
                                        ▼
                            ┌───────────────────────┐
                            │   Local Print Agent   │
                            │   (Shop-Local HTTP)   │
                            └───────────┬───────────┘
                                        │ RAW / IPP Protocol
                                        ▼
                            ┌───────────────────────┐
                            │   Physical Printer    │
                            │ (Canon, HP, Epson...) │
                            └───────────────────────┘
```

---

## Tech Stack

| Domain | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 15 (App Router, Server Components & Route Handlers) | Fullstack React framework |
| **Language** | TypeScript 5 (Strict Mode across monorepo) | End-to-end type safety |
| **Frontend UI** | React 19, Lucide React, Radix UI primitives | Accessible, reactive user interface |
| **Styling** | Vanilla CSS + Tailwind CSS utilities | Responsive design system |
| **Authentication** | NextAuth.js v5 (Auth.js) with JWT stateless sessions | Role-based authentication (`CUSTOMER`, `SHOP_OWNER`, `ADMIN`) |
| **Database** | PostgreSQL 16 via Prisma ORM | Relational schema, indexes, transactions, row-level consistency |
| **Job Queue** | BullMQ 5 + Redis 7 | Atomic job claiming, rate limits, exponential backoff retries |
| **Storage Layer** | Local Filesystem (dev) / S3-compatible (prod) | Encrypted, UUID-keyed document storage |
| **Worker Process** | Node.js standalone daemon | Background print job consumer |
| **Monorepo Tools** | Turborepo 2 + pnpm workspaces | Fast, cached, multi-package builds |
| **Testing** | Vitest, Testing Library | Fast unit and integration testing |

---

## Monorepo Project Structure

```
erb/
├── apps/
│   ├── web/                          # Next.js 15 Web Application
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages & API routes
│   │   │   │   ├── (public)/         # Landing page, shop finder
│   │   │   │   ├── admin/            # Admin portal (shops, users, metrics)
│   │   │   │   ├── api/v1/           # REST endpoints (documents, orders, pricing, shops)
│   │   │   │   ├── auth/             # Login, register, session endpoints
│   │   │   │   ├── dashboard/        # Customer dashboard
│   │   │   │   ├── orders/           # Customer order tracking & history
│   │   │   │   ├── shop/             # Shop Owner portal (printers, orders, pricing)
│   │   │   │   └── upload/           # 4-Step Print Wizard
│   │   │   ├── components/           # UI components (Navbar, ShopNav, AdminNav, Dialogs)
│   │   │   └── lib/                  # Auth config, storage service, pricing engine, state machine
│   │   ├── next.config.ts            # Next.js configuration
│   │   └── package.json
│   │
│   └── print-worker/                 # Standalone Background Worker
│       ├── src/
│       │   ├── processors/           # BullMQ job processors for print dispatch
│       │   ├── services/             # Redis, job events, agent client
│       │   └── index.ts              # Worker process entry point
│       └── package.json
│
├── packages/
│   ├── database/                     # Prisma schema, migrations, seed script
│   │   ├── prisma/schema.prisma      # Comprehensive relational data models
│   │   └── src/seed.ts               # Demo data seeder
│   ├── types/                        # Shared TypeScript models, enums & interfaces
│   └── validation/                   # Shared Zod validation schemas
│
├── docker/
│   ├── docker-compose.yml            # PostgreSQL 16, Redis 7, pgAdmin, Redis Commander
│   └── init/                         # Optional DB init scripts
│
├── .env.example                      # Template environment variables
├── package.json                      # Workspace scripts & devDependencies
├── pnpm-workspace.yaml               # pnpm monorepo workspace configuration
└── turbo.json                        # Turborepo task pipeline configuration
```

---

## Local Development Setup

### Prerequisites

Ensure the following tools are installed on your workstation:
- **Node.js**: `v20.0.0` or higher ([Download](https://nodejs.org/))
- **pnpm**: `v9.0.0` or higher (`npm install -g pnpm`)
- **Docker Desktop**: For running PostgreSQL and Redis containers ([Download](https://www.docker.com/products/docker-desktop/))

> **Note for Windows Users without Docker**: If you prefer not to use Docker, you can install PostgreSQL and Redis directly on your Windows machine and point the `DATABASE_URL` and `REDIS_URL` in `.env` to your local ports.

---

### 1. Clone & Install Dependencies

Clone the repository and install all workspace dependencies using `pnpm`:

```bash
git clone <your-repo-url>
cd "ERB WEB"
pnpm install
```

---

### 2. Environment Configuration

Create a `.env` file at the root of the repository (and ensure `apps/web/.env.local` exists for Next.js):

```bash
cp .env.example .env
```

Here is a breakdown of the critical environment variables:

```env
# ============================================================
# Database (PostgreSQL 16)
# ============================================================
DATABASE_URL="postgresql://erb_user:erb_password@localhost:5432/erb_db"

# ============================================================
# Redis (BullMQ Job Queue)
# ============================================================
REDIS_URL="redis://:erb_redis_password@localhost:6379"

# ============================================================
# NextAuth.js v5 (Session & Security)
# ============================================================
NEXTAUTH_URL="http://localhost:3000"
AUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="jyE69a4TyR87hZRy2Oa2WURmA4J0YiwdGZYJc2ZIriI="
AUTH_SECRET="jyE69a4TyR87hZRy2Oa2WURmA4J0YiwdGZYJc2ZIriI="

# ============================================================
# Document Storage (Local for Dev, S3 for Prod)
# ============================================================
STORAGE_PROVIDER="local"
STORAGE_LOCAL_PATH="./uploads"
MAX_UPLOAD_SIZE_BYTES=26214400 # 25 Megabytes

# ============================================================
# Print Worker & Agent
# ============================================================
WORKER_CONCURRENCY=2
WORKER_MAX_RETRIES=3
WORKER_RETRY_DELAY_MS=5000
AGENT_SECRET="CHANGE_ME_generate_with_openssl_rand_base64_32"
```

---

### 3. Start Infrastructure (Docker Compose)

Start the PostgreSQL 16 and Redis 7 containers in the background:

```bash
docker compose -f docker/docker-compose.yml up -d
```

To verify that the containers are healthy and running:

```bash
docker ps
```

You should see:
- `erb_postgres` listening on port `5432`
- `erb_redis` listening on port `6379`

*(Optional)* If you want web interfaces for the database and queue, run with the tools profile:
```bash
docker compose -f docker/docker-compose.yml --profile tools up -d
```
- **pgAdmin**: http://localhost:5050 (User: `admin@erb.local`, Pass: `admin`)
- **Redis Commander**: http://localhost:8081

---

### 4. Database Migration & Seeding

Once PostgreSQL is running, apply the database schema and populate it with seed data:

```bash
# Push schema or run migrations
pnpm db:migrate
# or alternatively: pnpm --filter @erb/database exec prisma db push

# Seed default users, demo print shop, and Canon printer
pnpm db:seed
```

You can view and inspect the database records at any time using **Prisma Studio**:

```bash
pnpm db:studio
```

---

### 5. Run Development Servers

Start the Next.js web application and the print worker concurrently:

```bash
pnpm dev
```

- **Web Application**: Visit [http://localhost:3000](http://localhost:3000)
- **Print Worker**: Runs in the background, listening to BullMQ print job queues.

To run only the web portal:
```bash
pnpm --filter @erb/web dev
```

To run only the print worker:
```bash
pnpm --filter @erb/print-worker dev
```

---

## Pre-Seeded Test Accounts

The `pnpm db:seed` command creates the following ready-to-use testing accounts:

| Role | Email | Password | Accessible Portals |
|---|---|---|---|
| **Customer** | `customer@erb.local` | `Password123` | `/upload` (Wizard), `/dashboard`, `/orders` (Live Tracking) |
| **Shop Owner** | `shop@erb.local` | `Password123` | `/shop/dashboard`, `/shop/orders`, `/shop/printers`, `/shop/pricing` |
| **Admin** | `admin@erb.local` | `Password123` | `/admin/dashboard`, `/admin/shops`, `/admin/users` |

---

## Core Workflows & Features

### 1. The 4-Step Print Wizard

Located at `/upload`, the print wizard walks customers through an intuitive ordering experience:

1. **Step 1: Upload Document**:
   - Drag & drop or browse for a PDF (up to 25MB).
   - Real-time client & server validation.
   - Shows extracted file size, page count, and SHA-256 checksum verification badge.
2. **Step 2: Print Options**:
   - **Color Mode**: Black & White or Full Color.
   - **Duplex Mode**: Single-sided (Simplex), Double-sided (Long Edge), or Double-sided (Short Edge).
   - **Paper Size**: A4, A3, Letter, Legal.
   - **Orientation**: Portrait or Landscape.
   - **Pages per Sheet (N-Up)**: 1, 2, 4, 6, 8, 9, or 16 pages per sheet.
   - **Scaling**: Fit to Printable Page, 100% Actual Size, or Custom % Scale.
   - **Print Quality**: Draft, Standard, or High Resolution.
   - **Copies & Page Range**: Print all pages or specify a custom start/end page range.
3. **Step 3: Choose Shop & Printer**:
   - Browse nearby active shops with distance, rating, and address.
   - Select an online printer belonging to that shop (e.g. Canon PIXMA G7070).
4. **Step 4: Review & Place Order**:
   - Live itemized price breakdown (base rate, duplex discount, paper surcharge, quantity, service fee).
   - Order submission with UUID-based idempotency key to prevent double charges.
   - Automatic redirect to the live order tracking page (`/orders/[id]`).

---

### 2. PDF Upload & Verification Subsystem

The PDF upload endpoint (`POST /api/v1/documents/upload`) implements strict security and reliability safeguards:

```
[User Selects File]
         │
         ▼
[Client Pre-Check]  ──> Checks format (.pdf, .PDF, application/pdf) & size (≤ 25MB)
         │
         ▼
[POST /api/v1/documents/upload (Multipart FormData)]
         │
         ├─► 1. Auth Guard: Requires valid JWT session (`auth()`)
         ├─► 2. ISO 32000-1 Magic Bytes Check: Validates `%PDF-` header in first 1024 bytes
         ├─► 3. Non-Enumerable Storage Key: Generates `documents/{YYYY}/{MM}/{userId}/{uuid}.pdf`
         │      (User filename is never used as filesystem path to prevent path traversal)
         ├─► 4. Storage Write: Writes buffer to local directory (`./uploads`) or S3
         ├─► 5. Cryptographic Checksum: Generates SHA-256 hash of file content
         ├─► 6. Binary Page Counter: Inspects PDF structure (`/Type /Pages /Count`)
         └─► 7. DB Persistence: Inserts `Document` row in PostgreSQL with 7-day auto-expiry
```

#### Why Might PDF Uploading Fail?
If you encounter an upload issue, check the following common causes:
- **Database is offline**: The backend saves document metadata to PostgreSQL. If Docker is stopped, the server logs `Upload failed: Can't reach database server at localhost:5432`. Ensure Docker is running (`docker compose up -d`).
- **User is not signed in**: The API requires an active session. Log in first at `/auth/login` (e.g. with `customer@erb.local` / `Password123`).
- **Invalid file header**: If the file is not a real PDF (e.g. a renamed `.txt` or corrupted file), the magic-byte validator rejects it.
- **File size > 25MB**: The system enforces a 25MB limit by default. Adjust `MAX_UPLOAD_SIZE_BYTES` in `.env` if larger documents are required.

---

### 3. Dynamic Pricing Calculation Engine

Prices are calculated deterministically on both the client (for instant preview) and the backend (`POST /api/v1/pricing/calculate`):

$$\text{Effective Pages} = \lceil \frac{\text{Selected Pages}}{\text{Pages per Sheet}} \rceil$$

$$\text{Sheets per Copy} = \begin{cases} \lceil \frac{\text{Effective Pages}}{2} \rceil & \text{if Duplex} \\ \text{Effective Pages} & \text{if Simplex} \end{cases}$$

$$\text{Subtotal} = (\text{Sheets per Copy} \times \text{Base Price} \times \text{Paper Multiplier}) \times \text{Copies}$$

$$\text{Total} = (\text{Subtotal} - \text{Volume Discount}) + \text{Service Fee}$$

- **Base Rates**: Black & White (₹2.00/page), Full Color (₹10.00/page).
- **Duplex Savings**: Double-sided printing reduces total paper consumption.
- **Paper Surcharges**: A4 (1.0x), A3 (2.0x), Legal (1.2x).
- **Volume Discounts**: Automatic percentage reduction on high-volume print runs.

---

### 4. Order State Machine

Orders transition strictly through validated states with database transaction locking:

```
                  ┌─────────┐
                  │ CREATED │
                  └────┬────┘
                       │ (PDF Uploaded & Validated)
                       ▼
                 ┌──────────┐
                 │ UPLOADED │
                 └─────┬────┘
                       │ (Customer submits print configuration & shop)
                       ▼
             ┌──────────────────┐
   ┌─────────┤ WAITING_FOR_SHOP ├─────────┐
   │         └─────────┬────────┘         │
   │ (Shop Rejection)  │ (Shop Approval)  │ (Customer Cancels)
   ▼                   ▼                  ▼
┌──────────┐     ┌──────────┐       ┌───────────┐
│ REJECTED │     │ ACCEPTED │       │ CANCELLED │
└──────────┘     └─────┬────┘       └───────────┘
                       │ (Pushed to BullMQ Redis Queue)
                       ▼
                  ┌────────┐
                  │ QUEUED │
                  └────┬───┘
                       │ (Print Worker claims job & matches capabilities)
                       ▼
                 ┌──────────┐
                 │ PRINTING ├─────────┐
                 └─────┬────┘         │ (Hardware / Connection Failure)
                       │              ▼
                       │         ┌────────┐
                       │         │ FAILED │ (Worker retries with backoff)
                       │         └───┬────┘
                       │             │ Retry Policy
                       │             ▼
                       │         ┌────────┐
                       │         │ QUEUED │
                       │         └────────┘
                       │ (Print Agent confirms physical output)
                       ▼
                 ┌───────────┐
                 │ COMPLETED │
                 └───────────┘
```

---

### 5. Print Worker & Local Agent Dispatch

1. **Job Queueing**: When an order is accepted by a shop owner, an atomic database transaction updates the order to `QUEUED` and enqueues a job into the BullMQ `print-jobs` queue in Redis.
2. **Worker Processing**: The `print-worker` background process consumes jobs, checks printer health, validates capabilities, and sets the state to `PRINTING`.
3. **Agent Communication**: The worker dispatches the job over HTTP to the shop's local **Print Agent** (running on the shop's local network beside the physical printer), authenticating with `AGENT_SECRET`.
4. **Physical Output**: The agent downloads the document buffer using the storage key, sends the raw raster data to the printer driver/spooler, and reports completion back to the worker.

---

## Role-Based Portals

### 1. Customer Portal (`/dashboard`, `/upload`, `/orders`)
- Start a new print order through the 4-step wizard.
- View real-time order tracking with dynamic progress bars and status badges.
- Download invoices, view order history, and re-order previous documents.

### 2. Shop Owner Portal (`/shop/dashboard`)
- **Incoming Orders (`/shop/orders`)**: Review incoming customer orders, inspect document parameters, and click **Accept** or **Reject**.
- **Printer Management (`/shop/printers`)**: Add, inspect, and toggle hardware printers (Canon, HP, Epson). Configure capabilities (color, duplex, supported paper sizes) and monitor online/offline heartbeat.
- **Pricing Matrix (`/shop/pricing`)**: Set custom per-page rates for black & white vs color, paper size multipliers, and volume discount rules.
- **Shop Settings (`/shop/settings`)**: Update shop name, address, operating hours, and contact details.

### 3. Admin Portal (`/admin/dashboard`)
- System-wide operational dashboard with live order counts, gross platform volume, active shops, and printer health.
- **Shops Management (`/admin/shops`)**: Approve, suspend, or audit registered print shops.
- **Users Management (`/admin/users`)**: Audit user accounts, inspect roles, and manage access permissions.

---

## Troubleshooting & FAQs

### Q: Why do I see "Upload failed. Please try again" or "Can't reach database server"?
- **Cause**: PostgreSQL is not running or unreachable at `localhost:5432`.
- **Fix**: Make sure Docker Desktop is running and run:
  ```bash
  docker compose -f docker/docker-compose.yml up -d
  ```
  Check that the container is healthy via `docker ps`. If running locally without Docker, verify that PostgreSQL service is started and matches the credentials in `.env`.

---

### Q: Docker Desktop says "failed to connect to docker API"?
- **Cause**: The Docker Desktop daemon has not finished starting on your Windows machine.
- **Fix**: Open Docker Desktop from the Windows Start menu, wait until the status indicator in the bottom-left turns green ("Engine running"), then run your `docker compose` command again.

---

### Q: Redis connection errors in print-worker?
- **Cause**: Redis is offline on port `6379`.
- **Fix**: Start the Redis container via `docker compose -f docker/docker-compose.yml up -d redis`.

---

### Q: How do I test with multiple user roles?
- Open an Incognito / Private browsing window or a secondary browser.
- In window 1, log in as `customer@erb.local` (Customer). Upload a document and place an order.
- In window 2, log in as `shop@erb.local` (Shop Owner). Open `/shop/orders`, view the incoming order, and click **Accept**.
- Watch the customer window update in real-time as the order transitions to `ACCEPTED`, `QUEUED`, and `PRINTING`!

---

## CLI Scripts Reference

| Command | Action |
|---|---|
| `pnpm dev` | Run all applications (web + worker) concurrently via Turborepo |
| `pnpm --filter @erb/web dev` | Start the Next.js web application only (`http://localhost:3000`) |
| `pnpm --filter @erb/print-worker dev` | Start the background print worker only |
| `pnpm build` | Build all workspace packages and applications for production |
| `pnpm test:unit` | Run all Vitest unit tests across packages |
| `pnpm type-check` | Run TypeScript compiler checks across all workspaces |
| `pnpm db:migrate` | Apply Prisma database migrations |
| `pnpm db:seed` | Seed database with demo accounts, shops, printers, and pricing rules |
| `pnpm db:studio` | Open interactive Prisma Studio GUI to inspect DB records |
| `pnpm clean` | Clean build caches (`.next`, `dist`, `node_modules`) |

---

## License

Private — ERB Cloud Printing Platform © 2026. All rights reserved.
