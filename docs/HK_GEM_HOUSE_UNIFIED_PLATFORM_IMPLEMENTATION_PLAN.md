# Hong Kong Gem House — Unified Website & Admin Portal Implementation Plan

**Working branch:** `feature/admin-portal-mvp`  
**Repository:** `uzairpat/Hong_Kong_Gem_House_Website_Starter`  
**Status:** Development baseline verified; end-to-end integration and remaining business modules are in progress.  
**Last updated:** 13 November 2026

## 1. Product decision

The public Hong Kong Gem House website and the owner Admin Portal are two interfaces of **one business platform**. They must not maintain separate gemstone inventories, customer lists, enquiry stores, or competing business databases.

The target is:

- One public website, preserving the approved single-page design and existing section anchors.
- One protected owner administration area at `/admin` in the same React application.
- One shared backend API service.
- One authoritative PostgreSQL database **per environment** (local development, staging, production).
- One set of API contracts and business rules for both interfaces.

The public website is read-only for controlled business data. The Admin Portal is the authorised management interface. The backend/database is the source of truth.

## 2. Target architecture

```text
Public visitors / Customers                    Company Owner
          |                                          |
          v                                          v
Public website routes                         /admin routes
          |                                          |
          +------------------+-----------------------+
                             |
                             v
                  Shared React/Vite application
                  - Public single-page website
                  - Collections and gemstone details
                  - Customer authentication/account
                  - Owner login and MFA
                  - Admin modules
                             |
                     VITE_API_BASE_URL
                             |
                             v
                    One Express API service
                    - Public catalogue API
                    - Customer auth/session API
                    - Public enquiry/event API
                    - Owner-only admin API
                    - Media/commerce/CMS APIs (to build)
                             |
                             v
                 One PostgreSQL database
                 for that environment
                 - users and sessions
                 - gemstones and media metadata
                 - customers and enquiries
                 - staff and audit history
                 - quotes/orders/invoices/payments (to build)
                 - CMS content/revisions (to build)
                 - analytics events
```

### Environment separation

| Environment | Frontend | Backend API | Database |
|---|---|---|---|
| Local development | Vite on localhost (currently port 5173) | localhost:4000 | `hk_gem_house_admin_dev` for this isolated test |
| Staging | Staging site/build | Staging API | Dedicated staging database |
| Production | Existing approved public domain, with `/admin` | Production API | Existing/new approved production HK Gem House database |

The local database created for this work is a **test database**. It is not the production database and must not be used as a direct replacement for production. The production website must only be connected during a planned release after database identity, backup, migration, secrets, domain and rollback checks.

Both the public routes and `/admin` must receive the same `VITE_API_BASE_URL` in a given deployment. The backend uses one `DATABASE_URL` for that environment. Do not configure one API/database for the public site and a different one for the Admin Portal in production.

## 3. Shared branding

The public website's existing brand component is:

- Component: `hong-kong-gem-house-website/src/components/BrandMark.tsx`
- Actual image asset: `/assets/01-homepage/hkg-logo-emblem.png`

The Admin Portal must reuse this same component and asset. Do not create or substitute a text-only logo, a new emblem, or a separate logo file for admin.

**Implemented in this branch:** `BrandMark` now accepts optional dimensions. Admin login and the admin sidebar reuse it at smaller sizes. Public header usage keeps its existing 80 × 88 sizing and asset.

## 4. Source-of-truth and synchronisation rules

### Gemstones

- The `gemstones` table is the authoritative record for each physical gemstone.
- Publication state (`draft`, `pending_review`, `published`, `archived`) is separate from physical availability (`available`, `reserved`, `sold`, `unavailable`).
- Admin create/edit/archive/publish actions write to the shared environment database.
- Public catalogue endpoints return only records approved for public display (published and visible), and must never return acquisition cost, private notes, or private certificate URLs.
- Sample/demo records must not appear in production.
- A successful admin save is not sufficient by itself: verify that the public collection/detail page reads the changed record from the same database.

### Images, videos and certificates

- PostgreSQL stores asset metadata and object keys, not the binary files.
- Publicly approved gemstone images/videos may be delivered publicly (with CDN support where appropriate).
- Certificates and other confidential documents remain private and are retrieved only through backend-authorised access or short-lived signed URLs.
- Existing `gemstone_images` is used by the current public catalogue query. Migration 004 also introduces provider-neutral `media_assets`, `gemstone_media`, and `certificates`. These representations must be reconciled before uploads are enabled; do not create two independent image galleries.
- Storage provider selection (including Replit Object Storage versus S3-compatible storage) is deliberately deferred until the Replit project/storage capability is reviewed. No bucket is provisioned by this plan.

### Enquiries and customers

- The public contact form submits to `POST /api/enquiries`.
- The backend commits the customer/profile and enquiry in one transaction; it returns success only after commit.
- The Admin Portal reads and manages those same records through `/api/admin/enquiries/*` and `/api/admin/customers`.
- Guest enquiries are supported; creating an enquiry does not require a customer account.
- A WhatsApp click is an outbound click event, not a received WhatsApp conversation. Official WhatsApp Business inbox integration is a later phase.

### Website content

- The website keeps the approved six-section single-page structure and IDs: `home`, `our-heritage`, `our-gemstones`, `quality-trust`, `global-presence`, `contact`.
- Admin CMS edits structured fields/media/CTAs for those sections, with draft, preview, publish and revision history.
- CMS must not replace the approved layout with an unrestricted page builder or break anchor navigation.

## 5. Existing implementation — verified baseline

### Implemented in the current working branch

- Public website, customer auth/account routes, and admin routes coexist in the same React application.
- Owner-only login, MFA setup/verification, protected admin session, and password recovery flow exist.
- Admin dashboard queries live counts from the configured database.
- Gemstone admin API supports create, update, publish, unpublish, archive, restore and history.
- Admin enquiry inbox supports status/priority/assignment and private notes.
- Staff directory supports records without granting staff portal login.
- Customer directory and activity/audit-log APIs exist.
- Public catalogue API `GET /api/gemstones` and `GET /api/gemstones/:referenceCode` reads published/visible database records.
- Public contact form posts to `/api/enquiries`; first-party event endpoint exists.
- WhatsApp click event now uses the CSRF token flow.
- Admin brand now reuses the exact emblem component/asset used in the public website.
- CI passed frontend typecheck/build and backend typecheck/build, PostgreSQL 16 migrations and one-time owner bootstrap on the latest verified baseline before the latest logo-only commits. Re-run CI after syncing the latest branch.

### Known gaps — do not describe these as complete

- The Ruby collection still has hardcoded gemstone records, facets/counts and image-number mapping.
- The gemstone detail page still renders hardcoded Ruby facts/gallery content rather than loading the selected record from the public API.
- Sapphire/Emerald/Rare collection pages fetch catalogue records, but need end-to-end verification against owner-created published inventory and uploaded media.
- Public section text/cards are currently largely static; the structured CMS has not been implemented.
- Contact enquiry persistence exists, but end-to-end customer notification/email delivery and all CRM scenarios still need testing.
- Admin Media & Certificates, Quotes & Invoices, CMS, Analytics, Reports and Settings currently contain deferred/placeholder views rather than complete workflows.
- Media schema exists, but upload, processing, private file access and delivery are not implemented.
- Sales data model and APIs for quotations, orders, invoices, payments, allocations, unapplied credit/refunds/receipts are not implemented.
- GA4 property integration, consent-management behaviour and reporting UI are not implemented.
- Live production cutover is not done. Existing public production traffic must remain untouched until the release checklist is approved.

## 6. Implementation roadmap

### Phase 0 — Shared platform foundation and brand
- Reuse the public logo component in admin (implemented).
- Keep public and admin routes in the same frontend application.
- Standardise the frontend API base setting and backend environment documentation.
- Preserve customer auth separately from owner auth; protect all owner endpoints with owner session, MFA and CSRF.
- Keep test/staging/production databases separate.

**Acceptance:** same shared logo asset; public and admin frontend requests use the same API base in each environment; auth and role boundaries verified; no production data touched by local migrations.

### Phase 1 — Unified gemstone catalogue (highest priority)
- Replace hardcoded Ruby collection data/facets/counts with API-backed records.
- Replace hardcoded detail-page facts/gallery with `GET /api/gemstones/:referenceCode`.
- Ensure all categories use the same canonical data type and API response.
- Build robust filtering/sorting/pagination where agreed.
- Reconcile `gemstone_images` with `media_assets`/`gemstone_media` before the upload work.
- Verify admin-created record lifecycle: draft → edit → publish → public collection/detail → unpublish/archive/restore.
- Ensure sample records are hidden in production and confidential fields never reach public JSON.

**Acceptance:** create/edit/publish a test gemstone in admin; it appears in the correct public category and detail page from the same database; edits and unpublishing are reflected on refresh; private cost/notes/certificate data are absent from public responses.

### Phase 2 — Enquiry CRM and customer operations
- Complete public contact form validation, duplicate customer matching, enquiry reference generation and persistence.
- Verify guest and signed-in submissions.
- Complete admin enquiry statuses, priority, assignment, notes, activities, follow-up/reminder handling and notifications.
- Add clear empty/loading/error states and safe handling of invalid/stale gemstone references.
- Track WhatsApp clicks separately from received enquiries.

**Acceptance:** submit a public enquiry and see the exact enquiry/customer in admin; update/assign/add note and confirm persistence after refresh; no false success when the API/database fails.

### Phase 3 — Media library and certificates
- Select and approve provider after Replit storage review; keep a provider-neutral storage adapter.
- Implement upload initiation, completion, checksum/type/signature/size validation, failure recovery, thumbnails/video processing as supported.
- Associate multiple images and video with a gemstone and set primary/sort order/alt text.
- Store certificates privately; provide authenticated preview/download and certificate metadata/verification status.
- Prevent private objects from being exposed through public catalogue responses.

**Acceptance:** owner can upload/reorder/replace/archive images; published public product displays approved images; private certificate is accessible to owner only and not from a public URL.

### Phase 4 — Sales and commerce
- Confirm company/legal invoice identity, base currencies, tax treatment, discount/rounding rules, document numbering and payment methods before finance schema is finalised.
- Implement quotation drafts/versions/issue/accept/reject/expiry.
- Convert accepted quotation to order.
- Implement order fulfilment/status, invoice issuance/PDF, external payment records, multi-invoice allocations, partial/overpayment and unapplied-credit handling, receipts, refunds/credit notes and reconciliation.
- Use exact decimal `NUMERIC` monetary values; preserve immutable issued-document versions and use adjustments instead of editing issued financial documents.

**Acceptance:** complete a test enquiry → quote → acceptance → order → invoice → partial payment/allocation → receipt workflow with audit history and correct outstanding/unapplied balances.

### Phase 5 — Structured website CMS
- Add editable structured content for the six existing public sections.
- Support text, image/media, CTA/link, SEO fields, draft/preview/publish, scheduled publication if approved, and revision/restore history.
- Keep page anchors, navigation, brand design and mobile layouts intact.
- Use published CMS data on the public website; keep safe fallbacks while content is loading.

**Acceptance:** owner edits a test headline/image/CTA, previews, publishes and confirms the same change is visible on the public website; older revision can be restored.

### Phase 6 — Analytics, notifications and reporting
- Complete first-party business events for page/category/gemstone views, image interactions, enquiry submitted, WhatsApp click, registration, quote/order/invoice/payment events.
- Add GA4 integration with consent handling. Never send email, phone, names, message content or other direct PII to GA4.
- Keep first-party enquiry/sales database records authoritative.
- Build dashboard/report filters, date ranges, source/conversion and export features.
- Add email notifications after production SMTP/provider configuration; do not display a notification as sent unless delivery status is known.

**Acceptance:** event counts reconcile with backend records; consent rules are honoured; GA4 payloads contain no PII; reports reconcile to underlying records.

### Phase 7 — Production integration and release
- Review current production website deployment, backend service, database identity and ownership before changing any connection.
- Back up and test restore; inspect migration history; rehearse forward migration on staging.
- Choose production database and storage locations; provision no storage until owner approval.
- Configure same production API base for public and admin frontend; configure CORS, cookie/session domain, HTTPS, reverse proxy and trusted origins.
- Configure production secrets, MFA key custody, SMTP, logging, monitoring, rate limits and backups.
- Run a full smoke/UAT suite on staging, then schedule cutover with rollback steps.
- Do not deploy from the feature branch directly to production without review and approval.

**Acceptance:** public visitor and owner admin use the same production API/database; admin changes are visible publicly after publish; public enquiries are visible in CRM; auth, MFA, private documents, backups, monitoring and rollback are verified.

## 7. End-to-end release test matrix

| Journey | Required verification |
|---|---|
| Owner access | Login, MFA, refresh, logout, session expiry, denied unauthorised access |
| Inventory | Create, edit, search, filter, publish, unpublish, archive, restore, audit |
| Public catalogue | Public only sees published/visible/non-sample records |
| Stone detail | Detail fields/media match the canonical record; no hardcoded demo values |
| Enquiry | Guest and signed-in submissions persist once and appear in admin |
| CRM | Assign, status, priority, due date, private note, activity and customer history |
| Media | Multiple public images/video, primary image, private certificate ACL and download |
| Commerce | Quote/order/invoice/payments/allocations/receipt reconciliation |
| CMS | Draft/preview/publish/revision/restore across six sections |
| Analytics | Consent, event mapping, no PII, reconciliation to first-party data |
| Resilience | API unavailable, DB unavailable, invalid input, upload interrupted, duplicate submit |
| Deployment | CORS/cookies/HTTPS, production env, backup/restore, monitoring and rollback |

A module is not complete when only its screen exists. It is complete only when its UI, API, database behaviour, permissions, error handling and end-to-end acceptance tests all pass.

## 8. Operational rules

1. Do not point a development/staging project at production or another product's database.
2. Do not run migrations against production without backup, database identity confirmation and release approval.
3. Do not store image/video/certificate binaries in PostgreSQL.
4. Never expose acquisition costs, internal notes or private certificates publicly.
5. Do not mark demo/sample gemstone rows as genuine inventory.
6. Do not treat a WhatsApp outbound click as an actual customer conversation.
7. Do not send personal data to GA4.
8. Keep owner MFA encryption key stable for existing MFA secrets; rotate only through a planned re-enrolment procedure.
9. Never commit `.env`, passwords, session secrets, MFA keys, tokens or storage credentials.
10. Do not claim production sync until public-site and admin E2E checks pass against the same staging/production database.

## 9. Open business decisions before related modules

- Production domain and whether admin stays at the same origin under `/admin`.
- Approved storage provider and Replit Object Storage capability/limits.
- Company legal name/address/tax identifiers for quotes and invoices.
- Enabled currencies, tax jurisdiction/rates and rounding rules.
- Quote/invoice/receipt numbering format.
- Public price display policy (hidden, enquiry, fixed) and inventory availability display policy.
- Certificate public summary policy and verification process.
- Email sender/provider and notification recipients.
- Privacy/consent wording, data-retention periods and deletion/export obligations.
- Final production database, backup cadence, retention and recovery expectations.

## 10. Immediate next tasks

1. Pull the latest `feature/admin-portal-mvp` branch into the separate local admin test clone.
2. Confirm the shared emblem appears on admin login and sidebar.
3. Re-run frontend typecheck/build and backend typecheck/build.
4. Open the public homepage and verify that it runs against the same local backend/database as `/admin`.
5. Create a clearly labelled test gemstone in admin; verify the existing public API response and identify the Ruby/detail-page hardcoded gaps.
6. Implement Phase 1 before enabling the remaining deferred admin modules.

**Current boundary:** the unified architecture is the target and the shared local API/database foundation exists. Full module completion and live production connection are not yet claimed.


## 11. Detailed stone inventory specification

The complete field-level specification is maintained in [HK Gem House Stone Inventory & Media Specification](./HK_GEM_HOUSE_STONE_INVENTORY_AND_MEDIA_SPEC.md). This is the required implementation reference for the inventory wizard; it supersedes the small initial add/edit form where they differ.

The stone wizard must have four steps: Stone Details, Certification, Pricing, and Photos & Videos. It must include every field, option catalogue, upload constraint, preview/review behaviour, supplier/ownership linkage, public-safe API rule and acceptance test stated in that specification.

**Do not mark the inventory-to-public-catalogue integration complete** until an owner-created record with complete details and approved media can be created, published, and verified on the actual public collection and detail routes from the same database.