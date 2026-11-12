# HK Gem House — Stone Inventory Record & Media Specification

**Branch:** `feature/admin-portal-mvp`  
**Status:** Approved functional target derived from the supplied AURIX inventory screenshots. This specifies HK Gem House behaviour and data requirements; the HK Gem House UI must retain its own premium ivory/gold identity and must not copy AURIX branding.

## 1. Required end-to-end behaviour

The owner creates and manages one canonical gemstone/stone record in the Admin Portal. The backend persists the complete stone specification and media associations. The public catalogue, collection cards, and stone detail page read the same published record through the shared API.

There must not be a second hardcoded Ruby inventory or a separate public-only gemstone dataset.

**Required lifecycle:** owner enters details → saves draft / adds to inventory → attaches certificates and media → reviews → publishes → public catalogue displays the saved public fields and approved public media → later edits/unpublish/archive update what is publicly visible.

A record can exist in inventory without being public. Public visibility requires publication status and an explicit public-visibility flag. Internal cost, markup, supplier/ownership notes and private certificate files must never be returned by public APIs.

## 2. Inventory creation wizard

Implement a four-step wizard, with progress navigation, Back/Continue, a persistent live stone preview, field validation, save/resume draft, and a final review summary:

1. Stone Details
2. Certification
3. Pricing
4. Photos & Videos

The owner can navigate back without losing entered data. The final action is **Add to Inventory** (and a separate publish action after review). A saved draft must not become visible on the public site automatically.

### Step 1 — Stone Details

| Field | Behaviour / validation |
|---|---|
| Stock Reference ID | Optional manual reference; unique when supplied. When blank, generate the next company stock reference and show it in the preview. The reference is immutable after the record has been created unless an explicit owner-controlled correction flow is provided. |
| Stone Type | Optional searchable configurable option. Seed the values evidenced in the screenshots: Diamond, Ruby, Sapphire, Emerald, Alexandrite, Spinel, Lab-Grown Diamond, Coloured Diamond, Mixed, Mixed Diamond Parcels, gemstone, parcel. Support additional company-defined values. |
| Shape | Searchable configurable option. Seed screenshot-evidenced values: Round Brilliant, Oval, Cushion, Pear, Princess, Radiant, Marquise, Round, Emerald, Parcel, Shield Cut, Aurora Fan Cut, Other. Support additional company-defined values. |
| Carat Weight | Optional positive decimal quantity, shown in carats (ct); preserve numeric precision. Allow an appropriate parcel/lot value where the inventory is recorded by pieces/weight rather than one individual stone. |
| Colour | Searchable configurable option. Seed screenshot-evidenced diamond grades D, E, F, G, H, I, L, M, N, N-Z, Fancy; support custom values such as the screenshot's test colour. The option list must permit coloured-stone descriptions, not only D–Z diamond grading. |
| Clarity | Searchable configurable option. Seed visible values FL, IF, VVS1, VVS2, VS1, VS2, SI2, I1, I2, I3; support more values and custom company options. |
| Cut | Configurable quality option, with screenshot-evidenced defaults: Excellent, Very Good, Good, Fair, Poor, plus blank/not-applicable. |
| Fluorescence | Configurable option, with screenshot-evidenced defaults: None, Faint, Medium, Strong, Very Strong, plus blank/not-applicable. |
| Polish | Configurable quality option, with defaults: Excellent, Very Good, Good, Fair, Poor, plus blank/not-applicable. |
| Symmetry | Configurable quality option, with defaults: Excellent, Very Good, Good, Fair, Poor, plus blank/not-applicable. |
| Pieces | Positive integer; default 1. Useful for parcels and mixed lots. |
| Measurements | Optional text field preserving professional notation (example shown: `6.42–6.45 × 3.98 mm`). |
| Country of Origin | Optional searchable/manual country or origin description (the screenshot shows examples such as Russia, Botswana and Sri Lanka). |
| Source Supplier | Optional searchable reference to a supplier record; selecting a supplier must link the actual supplier, not just store a display string. |
| Treatment | Configurable option; default can be None. Permit other treatments and company-defined values. |
| Notes | Internal owner/staff notes. Never expose in public catalogue responses. |
| Ownership | Required choice: Owned or Consignment (from supplier). Consignment requires a supplier link and must remain distinguishable in inventory/valuation/reporting. |

The options visible in the screenshots are initial defaults, not a closed list. Company owners must be able to add values. Search and selection should work for both seeded and custom values.

### Step 2 — Certification

| Field | Behaviour / validation |
|---|---|
| Grading Lab | Searchable, owner-configurable list. Seed screenshot-evidenced values: GIA, HRD, IGI, SSEF, Gübelin, Lotus, AGL, AGS, GCAL, None/Other. The screenshots also show custom labs, such as Test Gem Lab and Northstar Test Lab. |
| Report / Certificate No. | Optional identifier linked to the selected grading lab; validate sensible length and preserve leading zeros/letters. |
| Grading certificate files | Up to 5 files per stone; accepted formats PDF, PNG, JPG; max 5 MB per file and 25 MB combined. Show slot count and bytes used. Each upload has a status (initiated/uploaded/verifying/ready/failed/rejected); pending/rejected files cannot be opened or exposed. |

Certificate metadata and confidential files remain private to authorised owners. A public-facing certificate summary or verification status is a separate field/publishing decision; the actual certificate object is not public by default.

### Step 3 — Pricing

| Field | Behaviour / validation |
|---|---|
| Cost Price | Internal acquisition/cost total; non-negative decimal using the selected currency. Private from public APIs. |
| Cost/ct | Per-carat cost. Support entering either total cost or per-carat cost; calculate the other automatically when carat weight is available. |
| Ask Price | Intended selling/asking total; non-negative decimal using the selected currency. Public display depends on the selected public price mode. |
| Ask/ct | Per-carat ask price. Support entering either total ask or per-carat ask; calculate the other automatically when carat weight is available. |
| Currency | Company-enabled currency selector showing currency code and label (the screenshot example is USD — US Dollar). Persist ISO currency code. |
| Markup | Show and store the percentage used to derive/understand ask versus cost. The screenshot review summary displays Markup (example 10%). Define whether price is manually entered or calculated from cost + markup in the UX; never silently overwrite a manually entered ask price. |

Calculations must use decimal-safe arithmetic and adequate precision. Store money as PostgreSQL NUMERIC, not floating-point. Keep source entry and derived value distinguishable so editing one recomputes the other predictably. If carat weight is absent/zero (for a parcel), do not divide by it; allow valid total values and clearly mark per-carat value as unavailable.

The live preview/review summary should include the visible evidence from the screenshots: stock reference, shape, carat, colour/clarity, certificate indicator, ask price/currency and markup. Do not show cost to public users.

### Step 4 — Photos & Videos

Support multiple assets associated with a stone, with previews, primary image selection, ordering/reordering, removal/archive, caption/alt text and upload progress/status.

| Media type | Formats evidenced | Limit |
|---|---|---|
| Images | PNG, JPG/JPEG, WebP | Up to 20 MB per image |
| Videos | MP4, MOV, WebM | Up to 50 MB original; if over 10 MB, compress to 10 MB or less before final public delivery, subject to quality validation |

The screenshots describe the image limit as 20 MB each and video as 50 MB original with compression above 10 MB to 10 MB or less. The implementation must show the same guidance and enforce limits on both client and server. Do not merely trust filename extensions; inspect MIME type and file signatures. Handle failed/interrupted uploads safely.

Public approved images/videos are associated with the published stone and rendered on the matching public collection/detail page. Private certificates are stored and delivered separately and must not appear in the public media gallery. Keep media binaries in the approved object-storage provider; PostgreSQL stores asset metadata/object keys only. Storage provider remains undecided until Replit storage capabilities are reviewed.

## 3. Configurable option management

Implement shared company-level option sets for at least:

- Stone Type
- Shape
- Colour
- Clarity
- Cut
- Fluorescence
- Polish
- Symmetry
- Treatment
- Grading Lab
- Currency (currency support is enabled/configured, not freely invented by every operator)

Each option has a stable ID, display label, normalized value/code, sort order, active/archived state, system/custom provenance, and create/update audit data.

Required behaviour evidenced by screenshots:
- Search existing options.
- Choose an option.
- Use **+ Add Option** to add a company-specific custom value from the control.
- Show a remove (×) control for removable custom options.
- An unused custom value can be deleted.
- If a value is already referenced by inventory, a certificate or a historical record, it must be archived/deactivated rather than physically deleted; existing records retain their original value.
- Duplicate values are prevented after trim/case normalization.
- Changes to an option catalogue are company-wide and audit logged.
- Initial seeded system options cannot be removed by ordinary users; owner can deactivate them only through an explicit guarded action if business policy permits.

## 4. Data model requirements

The current `gemstones` table is too small for this specification. Extend it with a versioned migration; do not rewrite or edit previously-applied migrations.

Required stone fields (column names may follow the project's conventions):
- `stock_reference` / `reference_code`
- `stone_type_option_id` or stable selected value
- `category` / public collection mapping (support diamond as well as ruby, sapphire, emerald, rare/other)
- `weight_carat`, `pieces`
- `shape`, `colour`, `clarity`, `cut_grade`, `fluorescence`, `polish_grade`, `symmetry_grade`
- `measurements`, `country_of_origin`, `supplier_id`, `treatment`, `internal_notes`
- `ownership_type` (owned / consignment) and linked supplier
- `grading_lab`, `certificate_number`; certificate file associations through private certificate assets
- `cost_total`, `cost_per_carat`, `ask_total`, `ask_per_carat`, `currency_code`, `markup_percent`
- `status`, `availability_status`, `public_visibility`, `public_price_mode`
- actor/timestamps and audit history

Do not store only option display text if it will make company option management or reporting unreliable. Use stable option references where appropriate, while preserving a snapshot/display label for historical records when options are archived.

Supporting tables:
- `inventory_option_sets` and `inventory_options` (or equivalent normalized model)
- supplier records and ownership/consignment link
- certificate metadata linked to private media assets
- one canonical gemstone media association table for image/video gallery, with primary/sort order/alt/caption/status
- safe stock-reference counter/sequence if references are generated automatically

**Schema reconciliation required:** migration 001 created `gemstone_images`, while migration 004 created `media_assets` and `gemstone_media`. Reconcile these into one canonical media model, including migration/backfill strategy, before enabling upload. Avoid two independent image galleries.

## 5. Public website integration

The public website must read the exact same persisted inventory record via the shared public catalogue API.

- Collection routes filter by the mapped public category and return only `published`, `public_visibility = true`, non-sample records.
- Include public-safe fields: stock reference (subject to public reference policy), name/type, carat, shape, colour, clarity, cut where appropriate, origin where approved, public price mode/price, availability label, approved public gallery images/video and an optional public certification summary.
- Exclude cost price, cost/ct, markup, supplier identity, ownership/consignment details, notes, raw/private certificate files, internal audit data and private object keys.
- Ruby collection filtering/counts/pagination must derive from API data rather than the current hardcoded array.
- All category collections (Ruby, Sapphire, Emerald, Diamond, Rare/Other) must derive from the same API model.
- Stone detail pages must fetch by the canonical stock reference and render all public-safe saved details and the selected media gallery. Remove current hardcoded ruby details, fixed gallery and unrelated default detail fallbacks.
- Changes made in admin are reflected on the public website after publish/refresh/cache revalidation. Draft or unpublished changes are never exposed.
- A missing record/media item must produce a safe empty/error state, not fabricated gemstone data.

## 6. Admin screen and interaction requirements

- Match the four-step information architecture and clear density from the supplied references, but use HK Gem House typography, ivory/marble/gold design and shared brand emblem.
- Keep a stone preview visible as the owner progresses through the wizard.
- Add field-level validation, upload progress/status, clear file-size instructions and non-destructive navigation.
- Add/Edit should use the same underlying fields; edits must preload saved values and linked files.
- Inventory list must surface reference, type/category, key grade/weight, ownership, status, availability, price mode/ask value, updated time and actions.
- Search/filter by stock reference, stone type/category, supplier, grading lab, ownership, publication and availability.
- Audit all create/edit/publish/archive, option changes and media/certificate operations.

## 7. Acceptance tests (must pass before marking inventory complete)

1. Create a diamond with full grades and a stock reference; save a draft; refresh; every field is retained.
2. Create ruby, sapphire, emerald and another rare gemstone; each maps to the correct public collection.
3. Create a parcel with pieces and no invalid per-carat division; computed price fields behave safely.
4. Add a custom shape, colour and grading lab; select them; verify they persist across browser refresh and can be searched.
5. Remove an unused custom option; archive a referenced custom option; existing stones remain readable.
6. Upload up to five certificate files within the 5 MB each / 25 MB total limit; reject disallowed type/size and keep private access private.
7. Upload multiple PNG/JPG/WebP photos and MP4/MOV/WebM video; enforce per-file limits, compress video above 10 MB to <=10 MB, and retain progress/error status.
8. Set primary image and order; verify the gallery order and primary display persist after refresh.
9. Publish a stone; verify its public category card and detail page show the same saved fields and all approved media.
10. Edit public-safe details and republish; verify public website reflects edits.
11. Set availability to reserved/sold/unavailable; verify public display policy for each state.
12. Unpublish/archive; verify the public API and website no longer expose it.
13. Assert public API JSON has no cost, markup, supplier, ownership/internal notes or private certificate data.
14. Verify admin audit history for the stone and option/media changes.
15. Run frontend/backend typecheck, production build, PostgreSQL migration tests and API/UI end-to-end tests against an isolated test database.

## 8. Scope boundary

This specification covers the stone inventory record, configurable specification values, certification, pricing and media workflow, plus the required public catalogue/detail integration. It does not by itself approve an object-storage provider, create a storage bucket, set production credentials, or authorise production database changes. Those require separate environment review and release approval.
