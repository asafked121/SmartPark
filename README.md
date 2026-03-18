# SmartPark — Parking Reservation System

A full-stack parking reservation system with a React web UI and a Dockerized backend managing parking spaces.

## Architecture

| Service    | Technology               | Port |
|------------|--------------------------|------|
| Frontend   | React + Vite + Tailwind  | 3000 |
| Backend    | Node.js + Express        | 4000 |
| Database   | PostgreSQL 16            | 5432 |

## Quick Start

**Prerequisites:** Docker and Docker Compose installed.

```bash
# Copy the example env file and adjust secrets as needed
cp .env.example .env

# Start all services
docker compose up --build
```

Open **http://localhost:3000** in your browser.

### Default Admin Account

| Field    | Value                |
|----------|----------------------|
| Email    | admin@smartpark.com  |
| Password | admin123             |

### Local Development (without Docker)

```bash
# Backend
cd backend
npm install
JWT_SECRET=dev-secret npm run dev

# Frontend (in a separate terminal)
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `http://backend:4000` (Docker) or you can update `vite.config.js` to point to `http://localhost:4000` for local development.

## Environment Variables

Copy `.env.example` to `.env` before deploying. Key variables:

| Variable            | Description                   | Default               |
|---------------------|-------------------------------|-----------------------|
| `POSTGRES_PASSWORD` | Database password             | `smartpark123`        |
| `JWT_SECRET`        | Secret for signing JWT tokens | **(must be set)**     |
| `PORT`              | Backend listen port           | `4000`                |

> **Important:** The backend will refuse to start if `JWT_SECRET` is not set as an environment variable.

## Database Schema

The database is initialized automatically from `database/init.sql` and contains:

- **users** — Registered users with driver/admin roles
- **vehicles** — Vehicles linked to users (license plate, make, model)
- **parking_lots** — Parking facilities
- **parking_slots** — Individual slots with composite PK (lot_id, slot_number)
- **reservations** — Bookings with surrogate PK, double-booking prevention via UNIQUE constraint, and CHECK (end_time > start_time)
- **payments** — Financial transactions linked to reservations (one payment per reservation)

### Indexes

- `idx_reservations_slot_time` — Partial index on active reservations for fast overlap checks
- `idx_reservations_user` — Speeds up per-user reservation lookups

### Seed Data

Three parking lots are pre-loaded:

1. **North Campus Lot** — 30 slots, 1 floor
2. **South Campus Lot** — 24 slots, 1 floor
3. **Central Garage** — 48 slots, 3 floors

Test users: `alice@test.com`, `bob@test.com`, `carol@test.com`, `dave@test.com` (password: `password`)

## API Endpoints

| Method | Endpoint                        | Auth     | Description                     |
|--------|---------------------------------|----------|---------------------------------|
| POST   | /api/auth/register              | No       | Register a new driver account   |
| POST   | /api/auth/login                 | No       | Login and get JWT token         |
| GET    | /api/auth/me                    | Required | Get current user profile        |
| GET    | /api/config                     | No       | Get system config (rate/hr)     |
| GET    | /api/vehicles                   | Required | List user's vehicles            |
| POST   | /api/vehicles                   | Required | Add a vehicle                   |
| DELETE | /api/vehicles/:id               | Required | Remove a vehicle                |
| GET    | /api/lots                       | Required | List all parking lots           |
| GET    | /api/lots/:id                   | Required | Get lot details                 |
| GET    | /api/lots/:id/slots             | Required | Get slots with availability     |
| GET    | /api/reservations               | Required | List user's reservations        |
| POST   | /api/reservations               | Required | Create a reservation            |
| PATCH  | /api/reservations/:id/cancel    | Required | Cancel a reservation            |
| GET    | /api/payments                   | Required | List user's payments            |
| PATCH  | /api/payments/:id/pay           | Required | Process a payment (mock)        |
| GET    | /api/admin/occupancy            | Admin    | Lot occupancy stats             |
| GET    | /api/admin/revenue              | Admin    | Revenue analytics               |
| GET    | /api/admin/reservations         | Admin    | All reservations (paginated)    |

### Pagination

Listing endpoints (`/reservations`, `/payments`, `/admin/reservations`) support optional pagination via `?page=1&limit=20` query parameters. If omitted, up to 100 results are returned.

### Rate Limiting

Auth endpoints (`/auth/login`, `/auth/register`) are rate-limited to 20 requests per 15-minute window per IP.

### Input Validation

All write endpoints use `express-validator` for server-side validation (email format, password strength, field lengths, ISO 8601 dates, etc.).

## Security Notes

- **No self-registration as admin.** All new accounts are created as `driver`. Admins must be promoted via direct database access or the seed script.
- **JWT_SECRET is required.** The server will not start without it.
- **Passwords** must be at least 8 characters and contain at least one number.
- **Secrets** should be stored in `.env` (gitignored) rather than hardcoded.

## Payments

The payment system is a **mock implementation** for demonstration purposes. Clicking "Pay Now" marks the payment as paid in the database — no real payment processor is integrated. In a production system, this would integrate with Stripe, PayPal, or a similar provider.
