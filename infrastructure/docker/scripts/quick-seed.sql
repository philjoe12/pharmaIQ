-- Quick seed data for PharmaIQ
INSERT INTO drugs (set_id, drug_name, generic_name, manufacturer, slug, status, label_data, created_at, updated_at) VALUES
('1234-5678-90', 'Aspirin', 'Acetylsalicylic acid', 'Bayer', 'aspirin', 'published', '{"indicationsAndUsage": "For temporary relief of minor aches and pains", "warnings": "Do not use if allergic to aspirin"}', NOW(), NOW()),
('2345-6789-01', 'Tylenol', 'Acetaminophen', 'Johnson & Johnson', 'tylenol', 'published', '{"indicationsAndUsage": "For temporary relief of fever and pain", "warnings": "Do not exceed recommended dose"}', NOW(), NOW()),
('3456-7890-12', 'Advil', 'Ibuprofen', 'Pfizer', 'advil', 'published', '{"indicationsAndUsage": "For relief of pain, fever, and inflammation", "warnings": "May cause stomach bleeding"}', NOW(), NOW()),
('4567-8901-23', 'Lipitor', 'Atorvastatin', 'Pfizer', 'lipitor', 'published', '{"indicationsAndUsage": "To reduce cholesterol levels", "warnings": "May cause muscle pain"}', NOW(), NOW()),
('5678-9012-34', 'Zoloft', 'Sertraline', 'Pfizer', 'zoloft', 'published', '{"indicationsAndUsage": "Treatment of depression and anxiety", "warnings": "May increase suicidal thoughts in young adults"}', NOW(), NOW())
ON CONFLICT (set_id) DO NOTHING;

-- Add some basic AI content
INSERT INTO ai_enhanced_content (drug_id, simplified_description, meta_description, related_drugs, created_at, updated_at)
SELECT 
    id,
    drug_name || ' is a medication used for various conditions.',
    drug_name || ' - Learn about uses, side effects, and dosage information.',
    '["aspirin", "tylenol", "advil"]'::jsonb,
    NOW(),
    NOW()
FROM drugs
WHERE NOT EXISTS (SELECT 1 FROM ai_enhanced_content WHERE ai_enhanced_content.drug_id = drugs.id);

-- Add SEO metadata
INSERT INTO seo_metadata (drug_id, title, description, keywords, canonical_url, created_at, updated_at)
SELECT 
    id,
    drug_name || ' | Drug Information | PharmaIQ',
    'Complete information about ' || drug_name || ' including uses, dosage, side effects, and interactions.',
    ARRAY[LOWER(drug_name), LOWER(generic_name), 'medication', 'drug information'],
    '/drugs/' || slug,
    NOW(),
    NOW()
FROM drugs
WHERE NOT EXISTS (SELECT 1 FROM seo_metadata WHERE seo_metadata.drug_id = drugs.id);