-- Migration 005: richer gemstone records and configurable catalogue options.
-- Safe additive migration: existing inventory rows retain their current values.

ALTER TABLE gemstones
  ADD COLUMN IF NOT EXISTS cut VARCHAR(100),
  ADD COLUMN IF NOT EXISTS dimensions_mm VARCHAR(100),
  ADD COLUMN IF NOT EXISTS origin_region VARCHAR(120),
  ADD COLUMN IF NOT EXISTS sourcing_method VARCHAR(120),
  ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(180),
  ADD COLUMN IF NOT EXISTS supplier_reference VARCHAR(120),
  ADD COLUMN IF NOT EXISTS ownership_type VARCHAR(24) NOT NULL DEFAULT 'owned',
  ADD COLUMN IF NOT EXISTS stock_location VARCHAR(180),
  ADD COLUMN IF NOT EXISTS acquisition_date DATE,
  ADD COLUMN IF NOT EXISTS internal_notes TEXT,
  ADD COLUMN IF NOT EXISTS public_title VARCHAR(180),
  ADD COLUMN IF NOT EXISTS public_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_title VARCHAR(180),
  ADD COLUMN IF NOT EXISTS seo_description VARCHAR(320),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE gemstones
  ADD CONSTRAINT gemstones_ownership_type_check
  CHECK (ownership_type IN ('owned', 'consignment', 'client_owned', 'sourced_to_order'));

CREATE TABLE IF NOT EXISTS gemstone_option_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_type VARCHAR(40) NOT NULL
    CHECK (option_type IN ('category', 'shape', 'colour', 'clarity', 'origin', 'treatment', 'cut', 'certification_lab')),
  value VARCHAR(120) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (option_type, value)
);

INSERT INTO gemstone_option_values (option_type, value, display_order) VALUES
  ('category','Ruby',1),('category','Blue Sapphire',2),('category','Emerald',3),('category','Rare Gemstone',4),
  ('shape','Oval',1),('shape','Round',2),('shape','Cushion',3),('shape','Pear',4),('shape','Emerald Cut',5),('shape','Princess',6),('shape','Marquise',7),('shape','Cabochon',8),('shape','Other',99),
  ('colour','Red',1),('colour','Pigeon Blood Red',2),('colour','Pink',3),('colour','Blue',4),('colour','Royal Blue',5),('colour','Cornflower Blue',6),('colour','Green',7),('colour','Yellow',8),('colour','Violet',9),('colour','Colourless',10),('colour','Other',99),
  ('clarity','Loupe Clean',1),('clarity','VVS',2),('clarity','VS',3),('clarity','SI',4),('clarity','Included',5),('clarity','Eye Clean',6),('clarity','Other',99),
  ('origin','Myanmar (Burma)',1),('origin','Sri Lanka (Ceylon)',2),('origin','Mozambique',3),('origin','Madagascar',4),('origin','Thailand',5),('origin','India',6),('origin','Tanzania',7),('origin','Other / Unknown',99),
  ('treatment','No indications of treatment',1),('treatment','Heated',2),('treatment','Heated with residue',3),('treatment','Oiled',4),('treatment','Filled',5),('treatment','Diffusion treated',6),('treatment','Other / To be confirmed',99),
  ('cut','Excellent',1),('cut','Very Good',2),('cut','Good',3),('cut','Fair',4),('cut','Not graded',99),
  ('certification_lab','GIA',1),('certification_lab','Gübelin',2),('certification_lab','SSEF',3),('certification_lab','GRS',4),('certification_lab','AGL',5),('certification_lab','Other',99)
ON CONFLICT (option_type, value) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_gemstone_option_values_active
  ON gemstone_option_values (option_type, is_active, display_order);

CREATE TABLE IF NOT EXISTS gemstone_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gemstone_id UUID NOT NULL REFERENCES gemstones(id) ON DELETE CASCADE,
  document_type VARCHAR(24) NOT NULL CHECK (document_type IN ('certificate', 'valuation', 'invoice', 'other')),
  media_asset_id UUID REFERENCES media_assets(id) ON DELETE RESTRICT,
  title VARCHAR(180) NOT NULL,
  lab VARCHAR(120),
  certificate_number VARCHAR(120),
  issue_date DATE,
  visibility VARCHAR(16) NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public_summary')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gemstone_documents_gemstone
  ON gemstone_documents (gemstone_id, created_at DESC);
