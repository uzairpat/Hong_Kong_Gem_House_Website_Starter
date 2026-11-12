-- Migration 004: Owner admin portal, inventory controls, CRM and audit foundation.
-- No storage bucket or provider is created by this migration.

ALTER TABLE gemstones
  DROP CONSTRAINT IF EXISTS gemstones_status_check;

ALTER TABLE gemstones
  ADD CONSTRAINT gemstones_status_check
  CHECK (status IN ('draft', 'pending_review', 'published', 'archived'));

ALTER TABLE gemstones
  ADD COLUMN IF NOT EXISTS availability_status VARCHAR(24) NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS public_visibility BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS acquisition_cost NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS selling_price NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS currency_code CHAR(3),
  ADD COLUMN IF NOT EXISTS public_price_mode VARCHAR(16) NOT NULL DEFAULT 'hidden',
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE gemstones
  ADD CONSTRAINT gemstones_availability_status_check
  CHECK (availability_status IN ('available', 'reserved', 'sold', 'unavailable'));

ALTER TABLE gemstones
  ADD CONSTRAINT gemstones_public_price_mode_check
  CHECK (public_price_mode IN ('hidden', 'enquiry', 'fixed'));

ALTER TABLE gemstones
  ADD CONSTRAINT gemstones_acquisition_cost_nonnegative
  CHECK (acquisition_cost IS NULL OR acquisition_cost >= 0);

ALTER TABLE gemstones
  ADD CONSTRAINT gemstones_selling_price_nonnegative
  CHECK (selling_price IS NULL OR selling_price >= 0);

CREATE INDEX IF NOT EXISTS idx_gemstones_availability
  ON gemstones (availability_status, status);

CREATE INDEX IF NOT EXISTS idx_gemstones_updated_at
  ON gemstones (updated_at DESC);

-- Roles and permissions are created now; only the owner role is assignable in the first release.
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

INSERT INTO roles (code, name, description)
VALUES
  ('owner', 'Owner', 'Full access to the company administration portal.'),
  ('catalogue_manager', 'Catalogue Manager', 'Future role for gemstone inventory and public media.'),
  ('sales_manager', 'Sales Manager', 'Future role for enquiries and sales workflows.'),
  ('content_editor', 'Content Editor', 'Future role for structured website content.'),
  ('analyst', 'Analyst', 'Future read-only reporting role.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, description)
VALUES
  ('admin.access', 'Access the administration portal.'),
  ('dashboard.read', 'View dashboard metrics and alerts.'),
  ('gemstones.read', 'View gemstone inventory.'),
  ('gemstones.write', 'Create and update gemstone inventory.'),
  ('gemstones.publish', 'Publish and unpublish gemstone records.'),
  ('enquiries.read', 'View customer enquiries.'),
  ('enquiries.write', 'Update enquiries and internal notes.'),
  ('customers.read', 'View customer records.'),
  ('staff.read', 'View staff directory.'),
  ('staff.write', 'Maintain staff directory and assignments.'),
  ('media.manage', 'Manage media metadata and object storage references.'),
  ('sales.manage', 'Manage quotations, orders, invoices and payments.'),
  ('cms.manage', 'Manage structured public website content.'),
  ('analytics.read', 'View website and business analytics.'),
  ('settings.manage', 'Manage company settings and integrations.'),
  ('audit.read', 'View administrative activity records.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'owner'
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  mfa_required BOOLEAN NOT NULL DEFAULT TRUE,
  mfa_secret_encrypted TEXT,
  mfa_enabled_at TIMESTAMPTZ,
  last_admin_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(180) NOT NULL,
  email VARCHAR(320),
  phone VARCHAR(40),
  department VARCHAR(120),
  job_title VARCHAR(120),
  employment_status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (employment_status IN ('active', 'inactive', 'on_leave')),
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_profiles_email_lower
  ON staff_profiles (LOWER(email))
  WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  full_name VARCHAR(180) NOT NULL,
  company_name VARCHAR(180),
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(40),
  customer_status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (customer_status IN ('active', 'suspended', 'archived')),
  source VARCHAR(40) NOT NULL DEFAULT 'website',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_profiles_email_lower
  ON customer_profiles (LOWER(email));

-- Existing verified customer accounts are represented in the CRM directory.
INSERT INTO customer_profiles (user_id, full_name, company_name, email, phone, customer_status, source)
SELECT id, full_name, company_name, email, phone, 'active', 'website'
FROM users
WHERE account_type = 'customer' AND status = 'active'
ON CONFLICT (LOWER(email)) DO UPDATE
SET user_id = EXCLUDED.user_id,
    full_name = EXCLUDED.full_name,
    company_name = EXCLUDED.company_name,
    phone = EXCLUDED.phone,
    updated_at = NOW();

CREATE TABLE IF NOT EXISTS enquiry_number_counter (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_number BIGINT NOT NULL DEFAULT 0
);

INSERT INTO enquiry_number_counter (id, last_number)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_number VARCHAR(32) NOT NULL UNIQUE,
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
  gemstone_id UUID REFERENCES gemstones(id) ON DELETE SET NULL,
  name_snapshot VARCHAR(180) NOT NULL,
  email_snapshot VARCHAR(320) NOT NULL,
  company_snapshot VARCHAR(180),
  phone_snapshot VARCHAR(40),
  enquiry_type VARCHAR(80) NOT NULL,
  message TEXT NOT NULL,
  source VARCHAR(40) NOT NULL DEFAULT 'website'
    CHECK (source IN ('website', 'whatsapp', 'phone', 'email', 'manual', 'other')),
  source_path TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'assigned', 'in_progress', 'waiting_customer', 'quotation_sent', 'won', 'lost', 'closed')),
  priority VARCHAR(16) NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status_created
  ON enquiries (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enquiries_customer
  ON enquiries (customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_enquiries_assigned_due
  ON enquiries (assigned_staff_id, due_at)
  WHERE assigned_staff_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS enquiry_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enquiry_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  activity_type VARCHAR(60) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS follow_up_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID REFERENCES enquiries(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE CASCADE,
  assigned_staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'completed', 'cancelled')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (enquiry_id IS NOT NULL OR customer_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(100),
  before_data JSONB,
  after_data JSONB,
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(80),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs (entity_type, entity_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON audit_logs (actor_user_id, occurred_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(80) NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'success', 'warning', 'critical')),
  title VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  entity_type VARCHAR(80),
  entity_id VARCHAR(100),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(80) NOT NULL,
  event_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  anonymous_id VARCHAR(100),
  page_path TEXT,
  section_key VARCHAR(80),
  gemstone_id UUID REFERENCES gemstones(id) ON DELETE SET NULL,
  category VARCHAR(24),
  source VARCHAR(80),
  consent_state VARCHAR(24) NOT NULL DEFAULT 'unknown',
  properties JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_time
  ON analytics_events (event_name, event_time DESC);

-- Provider-neutral storage metadata only. The actual bucket/resource is provisioned separately.
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(40) NOT NULL,
  container_name VARCHAR(180),
  object_key TEXT NOT NULL UNIQUE,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  byte_size BIGINT NOT NULL CHECK (byte_size >= 0),
  checksum_sha256 CHAR(64),
  asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('image', 'video', 'document')),
  visibility VARCHAR(16) NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('public', 'private')),
  upload_status VARCHAR(20) NOT NULL DEFAULT 'initiated'
    CHECK (upload_status IN ('initiated', 'uploaded', 'verifying', 'ready', 'processing', 'failed', 'archived')),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS gemstone_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gemstone_id UUID NOT NULL REFERENCES gemstones(id) ON DELETE CASCADE,
  media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
  role VARCHAR(16) NOT NULL DEFAULT 'gallery'
    CHECK (role IN ('hero', 'gallery', 'video')),
  alt_text VARCHAR(240),
  caption VARCHAR(300),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (gemstone_id, media_asset_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gemstone_media_one_primary
  ON gemstone_media (gemstone_id)
  WHERE is_primary = TRUE;

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gemstone_id UUID NOT NULL REFERENCES gemstones(id) ON DELETE CASCADE,
  media_asset_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
  lab VARCHAR(120),
  certificate_number VARCHAR(120),
  issue_date DATE,
  verification_status VARCHAR(24) NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
  public_summary TEXT,
  private_notes TEXT,
  visibility VARCHAR(16) NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'public_summary')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (media_asset_id)
);
