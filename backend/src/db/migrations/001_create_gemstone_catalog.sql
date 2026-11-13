CREATE TABLE IF NOT EXISTS gemstones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  category VARCHAR(24) NOT NULL CHECK (category IN ('ruby', 'sapphire', 'emerald', 'rare')),
  weight_carat NUMERIC(8, 2),
  shape VARCHAR(80),
  origin VARCHAR(120),
  colour VARCHAR(120),
  clarity VARCHAR(80),
  treatment VARCHAR(160),
  certification_lab VARCHAR(120),
  certification_number VARCHAR(120),
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  is_sample BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gemstones_weight_nonnegative CHECK (weight_carat IS NULL OR weight_carat >= 0)
);

CREATE TABLE IF NOT EXISTS gemstone_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gemstone_id UUID NOT NULL REFERENCES gemstones(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  alt_text VARCHAR(240),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gemstone_images_unique_path UNIQUE (gemstone_id, image_path)
);

CREATE INDEX IF NOT EXISTS idx_gemstones_category_status
  ON gemstones (category, status);

CREATE INDEX IF NOT EXISTS idx_gemstones_sample_status
  ON gemstones (is_sample, status);

CREATE INDEX IF NOT EXISTS idx_gemstone_images_gemstone_order
  ON gemstone_images (gemstone_id, is_primary DESC, sort_order ASC);
