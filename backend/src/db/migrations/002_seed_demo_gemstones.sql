-- Development-only catalogue fixtures.
-- Every row is explicitly marked is_sample = TRUE. Production API queries exclude these rows.
-- Values copied from the existing eight ruby UI records are preserved as demonstration data,
-- not represented as verified company inventory.

INSERT INTO gemstones (
  reference_code, name, category, weight_carat, shape, origin, colour, clarity,
  treatment, certification_lab, certification_number, description, status, is_sample
) VALUES
  ('RBY-001', 'Natural Ruby RBY-001', 'ruby', 5.12, 'Oval', 'Myanmar (Burma)', 'Pigeon Blood Red', 'VVS',
   NULL, NULL, NULL, 'Demonstration record based on the existing website sample catalogue. Not verified company inventory.', 'published', TRUE),
  ('RBY-002', 'Natural Ruby RBY-002', 'ruby', 3.08, 'Cushion', 'Sri Lanka (Ceylon)', 'Vivid Red', 'VS',
   NULL, NULL, NULL, 'Demonstration record based on the existing website sample catalogue. Not verified company inventory.', 'published', TRUE),
  ('RBY-003', 'Natural Ruby RBY-003', 'ruby', 2.36, 'Round', 'Mozambique', 'Rich Red', 'VS',
   NULL, NULL, NULL, 'Demonstration record based on the existing website sample catalogue. Not verified company inventory.', 'published', TRUE),
  ('RBY-004', 'Natural Ruby RBY-004', 'ruby', 4.21, 'Pear', 'Myanmar (Burma)', 'Vivid Red', 'VVS',
   NULL, NULL, NULL, 'Demonstration record based on the existing website sample catalogue. Not verified company inventory.', 'published', TRUE),
  ('RBY-005', 'Natural Ruby RBY-005', 'ruby', 1.85, 'Oval', 'Thailand', 'Red', 'VS',
   NULL, NULL, NULL, 'Demonstration record based on the existing website sample catalogue. Not verified company inventory.', 'published', TRUE),
  ('RBY-006', 'Natural Ruby RBY-006', 'ruby', 6.03, 'Emerald Cut', 'Mozambique', 'Deep Red', 'VVS',
   NULL, NULL, NULL, 'Demonstration record based on the existing website sample catalogue. Not verified company inventory.', 'published', TRUE),
  ('RBY-007', 'Natural Ruby RBY-007', 'ruby', 3.47, 'Oval', 'Sri Lanka (Ceylon)', 'Vivid Red', 'VS',
   NULL, NULL, NULL, 'Demonstration record based on the existing website sample catalogue. Not verified company inventory.', 'published', TRUE),
  ('RBY-008', 'Natural Ruby RBY-008', 'ruby', 2.91, 'Cushion', 'Madagascar', 'Red', 'VVS',
   NULL, NULL, NULL, 'Demonstration record based on the existing website sample catalogue. Not verified company inventory.', 'published', TRUE),

  ('SAP-001', 'Demonstration Blue Sapphire 01', 'sapphire', NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, 'Demonstration catalogue entry only. Replace with verified company inventory before production.', 'published', TRUE),
  ('SAP-002', 'Demonstration Blue Sapphire 02', 'sapphire', NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, 'Demonstration catalogue entry only. Replace with verified company inventory before production.', 'published', TRUE),
  ('SAP-003', 'Demonstration Blue Sapphire 03', 'sapphire', NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, 'Demonstration catalogue entry only. Replace with verified company inventory before production.', 'published', TRUE),
  ('SAP-004', 'Demonstration Blue Sapphire 04', 'sapphire', NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, 'Demonstration catalogue entry only. Replace with verified company inventory before production.', 'published', TRUE),

  ('EMR-001', 'Demonstration Emerald 01', 'emerald', NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, 'Demonstration catalogue entry only. Replace with verified company inventory before production.', 'published', TRUE),
  ('EMR-002', 'Demonstration Emerald 02', 'emerald', NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, 'Demonstration catalogue entry only. Replace with verified company inventory before production.', 'published', TRUE),
  ('EMR-003', 'Demonstration Emerald 03', 'emerald', NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, 'Demonstration catalogue entry only. Replace with verified company inventory before production.', 'published', TRUE),
  ('EMR-004', 'Demonstration Emerald 04', 'emerald', NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, 'Demonstration catalogue entry only. Replace with verified company inventory before production.', 'published', TRUE),

  ('RAR-001', 'Demonstration Rare Gemstone 01', 'rare', NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, 'Demonstration catalogue entry only. Replace with verified company inventory before production.', 'published', TRUE),
  ('RAR-002', 'Demonstration Rare Gemstone 02', 'rare', NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, 'Demonstration catalogue entry only. Replace with verified company inventory before production.', 'published', TRUE),
  ('RAR-003', 'Demonstration Rare Gemstone 03', 'rare', NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, 'Demonstration catalogue entry only. Replace with verified company inventory before production.', 'published', TRUE),
  ('RAR-004', 'Demonstration Rare Gemstone 04', 'rare', NULL, NULL, NULL, NULL, NULL,
   NULL, NULL, NULL, 'Demonstration catalogue entry only. Replace with verified company inventory before production.', 'published', TRUE)
ON CONFLICT (reference_code) DO NOTHING;

INSERT INTO gemstone_images (gemstone_id, image_path, alt_text, sort_order, is_primary)
SELECT g.id, v.image_path, v.alt_text, 0, TRUE
FROM (VALUES
  ('RBY-001', '/assets/ruby-card-1.jpg', 'Demonstration ruby photograph 1'),
  ('RBY-002', '/assets/ruby-card-2.jpg', 'Demonstration ruby photograph 2'),
  ('RBY-003', '/assets/ruby-card-3.jpg', 'Demonstration ruby photograph 3'),
  ('RBY-004', '/assets/ruby-card-4.jpg', 'Demonstration ruby photograph 4'),
  ('RBY-005', '/assets/ruby-card-5.jpg', 'Demonstration ruby photograph 5'),
  ('RBY-006', '/assets/ruby-card-6.jpg', 'Demonstration ruby photograph 6'),
  ('RBY-007', '/assets/ruby-card-7.jpg', 'Demonstration ruby photograph 7'),
  ('RBY-008', '/assets/ruby-card-8.jpg', 'Demonstration ruby photograph 8'),
  ('SAP-001', '/assets/03-gemstone-categories/gemstone-blue-sapphire.jpg', 'Demonstration sapphire category image'),
  ('SAP-002', '/assets/03-gemstone-categories/gemstone-blue-sapphire.jpg', 'Demonstration sapphire category image'),
  ('SAP-003', '/assets/03-gemstone-categories/gemstone-blue-sapphire.jpg', 'Demonstration sapphire category image'),
  ('SAP-004', '/assets/03-gemstone-categories/gemstone-blue-sapphire.jpg', 'Demonstration sapphire category image'),
  ('EMR-001', '/assets/03-gemstone-categories/gemstone-emerald.jpg', 'Demonstration emerald category image'),
  ('EMR-002', '/assets/03-gemstone-categories/gemstone-emerald.jpg', 'Demonstration emerald category image'),
  ('EMR-003', '/assets/03-gemstone-categories/gemstone-emerald.jpg', 'Demonstration emerald category image'),
  ('EMR-004', '/assets/03-gemstone-categories/gemstone-emerald.jpg', 'Demonstration emerald category image'),
  ('RAR-001', '/assets/03-gemstone-categories/gemstone-rare.jpg', 'Demonstration rare gemstone category image'),
  ('RAR-002', '/assets/03-gemstone-categories/gemstone-rare.jpg', 'Demonstration rare gemstone category image'),
  ('RAR-003', '/assets/03-gemstone-categories/gemstone-rare.jpg', 'Demonstration rare gemstone category image'),
  ('RAR-004', '/assets/03-gemstone-categories/gemstone-rare.jpg', 'Demonstration rare gemstone category image')
) AS v(reference_code, image_path, alt_text)
JOIN gemstones g ON g.reference_code = v.reference_code
ON CONFLICT (gemstone_id, image_path) DO NOTHING;
