<!-- This file may contain content made using generative AI. This comment satisfies requirements for this courses AI disclosure policys. -->

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
docker compose up --build
```

Open **http://localhost:3000** in your browser.

### Default Admin Account

| Field    | Value                |
|----------|----------------------|
| Email    | admin@smartpark.com  |
| Password | admin123             |

You can also register a new account (driver or admin) via the registration page.

## Database Schema

The database is initialized automatically from `database/init.sql` and contains:

- **users** — Registered users with driver/admin roles
- **vehicles** — Vehicles linked to users (license plate, make, model)
- **parking_lots** — Parking facilities
- **parking_slots** — Individual slots with composite PK (lot_id, slot_number)
- **reservations** — Bookings with surrogate PK, double-booking prevention via UNIQUE constraint, and CHECK (end_time > start_time)
- **availability** — 15-minute granularity slot availability
- **payments** — Financial transactions linked to reservations via simple FK

### Seed Data

Three parking lots are pre-loaded:

1. **North Campus Lot** — 30 slots, 1 floor
2. **South Campus Lot** — 24 slots, 1 floor
3. **Central Garage** — 48 slots, 3 floors

## API Endpoints

| Method | Endpoint                        | Auth     | Description                     |
|--------|---------------------------------|----------|---------------------------------|
| POST   | /api/auth/register              | No       | Register a new user             |
| POST   | /api/auth/login                 | No       | Login and get JWT token         |
| GET    | /api/auth/me                    | Required | Get current user profile        |
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
| PATCH  | /api/payments/:id/pay           | Required | Process a payment               |
| GET    | /api/admin/occupancy            | Admin    | Lot occupancy stats             |
| GET    | /api/admin/revenue              | Admin    | Revenue analytics               |
| GET    | /api/admin/reservations         | Admin    | All reservations                |
