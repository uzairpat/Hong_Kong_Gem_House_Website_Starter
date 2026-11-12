# Hong Kong Gem House — Shared API

This API is the shared backend for the public React/Vite website and the owner Admin Portal. Both frontends must use the same `VITE_API_BASE_URL` in each environment, and this API must use the one approved `DATABASE_URL` for that environment.

## Requirements

- Node.js 22.12 or newer
- PostgreSQL
- A dedicated Hong Kong Gem House database for each environment
- For the current isolated local admin test, the database is `hk_gem_house_admin_dev`

## Local setup

1. Open a terminal in this `backend` folder.
2. Install dependencies with `npm ci`.
3. Copy `.env.example` to `.env` and set the local application-role password.
4. Set a random `SESSION_SECRET` of at least 32 characters.
5. Generate a private 32-byte MFA encryption key and base64-encode it. Keep the same key stable anywhere that needs to decrypt the enrolled owner MFA secret.
6. Confirm the exact local database name and owner before applying migrations.
7. Apply migrations with `npm run migrate`.
8. Start the API with `npm run dev`.

The API listens on port 4000 by default. The local frontend example is configured to call `http://localhost:4000`.

## First owner account

There is no public admin registration endpoint.

1. Set `ADMIN_OWNER_EMAIL` and a temporary `ADMIN_OWNER_PASSWORD` of at least 16 characters in the backend environment.
2. Run `npm run admin:bootstrap` exactly once after migrations have completed.
3. Remove `ADMIN_OWNER_PASSWORD` from the environment.
4. Sign in at `/admin/login` and complete authenticator-app MFA setup.

The bootstrap creates the initial owner only. Do not rerun it to reset an account and do not run it against production until database identity, backup and owner email have been checked.

## Shared application architecture

- Public website routes and `/admin` are routes in the same React/Vite application.
- Both use `VITE_API_BASE_URL`; do not give the public website and admin portal separate production APIs.
- This API serves the public catalogue, customer authentication, enquiries/events and owner-only management routes.
- Both interfaces use the same PostgreSQL database within an environment. Development, staging and production each have their own environment-specific database; never point local testing at production.
- Production cutover is a separate approved release. The current local database `hk_gem_house_admin_dev` is a test database, not the live business database.

## API overview

- `GET /api/health` — service and PostgreSQL connectivity.
- `GET /api/gemstones` and `GET /api/gemstones/:referenceCode` — public published catalogue.
- `POST /api/enquiries` — guest-capable public enquiry form.
- `POST /api/events` — consent-aware first-party event capture.
- `/api/auth/*` — customer authentication and session.
- `/api/admin/auth/*` — owner password sign-in, MFA and password recovery.
- `/api/admin/dashboard/summary` — owner dashboard metrics.
- `/api/admin/gemstones/*` — owner inventory management.
- `/api/admin/enquiries/*` — enquiry inbox, assignments and private notes.
- `/api/admin/staff/*` — staff directory (staff records do not grant portal access).
- `/api/admin/customers`, `/api/admin/notifications`, `/api/admin/audit-logs`.

State-changing requests require a CSRF token from `GET /api/auth/csrf`. Admin routes additionally require an owner session and MFA verification.

## Database and storage safety

- Use only a dedicated Hong Kong Gem House database. Do not point this backend at GrowAIs or another project database.
- Run `npm run migrate` only after confirming the exact database/environment and a restorable backup.
- Development catalogue fixtures are marked `is_sample = TRUE`; owner inventory APIs exclude them and production public catalogue APIs filter them out.
- Public catalogue responses must never include acquisition cost, internal notes or private certificate URLs.
- Migration 004 adds provider-neutral media metadata/object-key tables. No AWS or Replit bucket is created by migrations. Public gemstone imagery and private certificates must use different access policies.
- The existing public catalogue query reads `gemstone_images`; reconcile it with `media_assets`/`gemstone_media` before enabling new uploads. Do not create two separate image galleries.
- Customer enquiry success is returned only after the database transaction commits.

## Current implementation boundary

Owner auth/MFA, dashboard, inventory CRUD/publication, enquiry CRM foundation, staff directory, customer directory and audit foundation exist. Full object-storage upload/delivery, complete database-driven Ruby/detail pages, quotations, orders, invoices, payment allocations, structured CMS editing, GA4 reporting and production cutover are not complete. Do not present deferred modules as live until their APIs and end-to-end tests pass.

See [the unified implementation plan](../docs/HK_GEM_HOUSE_UNIFIED_PLATFORM_IMPLEMENTATION_PLAN.md) for architecture, feature status, delivery phases, acceptance criteria and release controls.
