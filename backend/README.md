# Hong Kong Gem House API

Backend foundation for the existing React/Vite public website and owner administration portal.

## Requirements

- Node.js 22.12 or newer
- PostgreSQL
- A dedicated development database (the documented local name is \`hk_gem_house_dev\`)

## Local setup

1. Open a terminal in this \`backend\` folder.
2. Install dependencies with \`npm install\`.
3. Copy \`.env.example\` to \`.env\` and set the local PostgreSQL password.
4. Set a random \`SESSION_SECRET\` of at least 32 characters.
5. Generate a private 32-byte MFA encryption key and base64-encode it. Keep the same key in each environment that needs to decrypt the owner MFA secret.
6. Apply migrations with \`npm run migrate\`.
7. Start the API with \`npm run dev\`.

The API listens on port 4000 by default.

## First owner account

There is no public admin registration endpoint.

1. Set \`ADMIN_OWNER_EMAIL\` and a temporary \`ADMIN_OWNER_PASSWORD\` of at least 16 characters in the backend environment.
2. Run \`npm run admin:bootstrap\` once after migrations have completed.
3. Remove \`ADMIN_OWNER_PASSWORD\` from the environment.
4. Sign in at \`/admin/login\` and complete authenticator-app MFA setup.

The bootstrap refuses to run when an administrator already exists. Do not run it against production until the database identity, backup and owner email have been checked.

## API overview

- \`GET /api/health\` — service and PostgreSQL connectivity.
- \`GET /api/gemstones\` and \`GET /api/gemstones/:referenceCode\` — public published catalogue.
- \`POST /api/enquiries\` — guest-capable public enquiry form.
- \`POST /api/events\` — consent-aware first-party event capture.
- \`/api/admin/auth/*\` — owner password sign-in, MFA and password recovery.
- \`/api/admin/dashboard/summary\` — owner dashboard metrics.
- \`/api/admin/gemstones/*\` — owner inventory management.
- \`/api/admin/enquiries/*\` — enquiry inbox, assignments and private notes.
- \`/api/admin/staff/*\` — staff directory (staff records do not grant portal access).
- \`/api/admin/customers\`, \`/api/admin/notifications\`, \`/api/admin/audit-logs\`.

State-changing requests require a CSRF token from \`GET /api/auth/csrf\`. Admin routes additionally require an owner session and MFA verification.

## Database and storage safety

- Use only a dedicated Hong Kong Gem House development database. Do not point this backend at GrowAIs or another project database.
- Run \`npm run migrate\` only after confirming the exact database/environment and a restorable backup.
- Development catalogue fixtures are marked \`is_sample = TRUE\`; owner inventory APIs exclude them.
- Public catalogue responses never include acquisition cost or internal notes.
- Media tables store provider-neutral metadata/object keys only. No AWS or Replit bucket is created by migrations. Public images and private certificates must be delivered with different access policies.
- Customer enquiry success is returned only after the database transaction commits.

## Current release boundary

The owner auth/MFA, dashboard, inventory, enquiry CRM, staff directory and audit foundation are being implemented first. Full object-storage uploads, quotations, orders, invoices, payment allocations, structured CMS editing and GA4 reporting remain separate implementation slices. Do not present those modules as live until their APIs and end-to-end tests are complete.
