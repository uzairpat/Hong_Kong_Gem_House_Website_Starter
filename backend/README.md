# Hong Kong Gem House API

This service is the backend foundation for the existing React/Vite website.

## Requirements

- Node.js 22.12 or newer
- PostgreSQL
- The local development database named `hk_gem_house_dev`

## Local setup

1. Open a terminal in this `backend` folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`.
4. Update only the local PostgreSQL password in `.env`. Do not commit `.env`.
5. Apply database migrations:

   ```bash
   npm run migrate
   ```

6. Start the API:

   ```bash
   npm run dev
   ```

The API listens on port 4000 by default.

## Initial endpoints

- `GET /api/health` — service and PostgreSQL connectivity.
- `GET /api/gemstones` — published catalogue entries.
- `GET /api/gemstones/:referenceCode` — one catalogue entry.

In development, demonstration records are visible. In production, records marked `is_sample = true` are excluded by the API.

## Database safety

This backend connects only to the database configured in `DATABASE_URL`. For local development, use `hk_gem_house_dev`; do not point it at the existing GrowAIs database.

The initial SQL migrations create the gemstone catalogue and insert clearly identified demonstration records. No real company inventory, prices, stock claims, or certificate details are created.

## Current scope

This is the first backend foundation only. Customer authentication, enquiries, administrator permissions, image upload storage, and WhatsApp Cloud API will be added in later phases.
