-- Fix database tables and column names for PharmaIQ

-- Create drug_content table with correct column names
CREATE TABLE IF NOT EXISTS drug_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drug_id UUID NOT NULL UNIQUE REFERENCES drugs(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    indications TEXT,
    contraindications TEXT,
    dosage TEXT,
    warnings TEXT,
    side_effects TEXT,
    enhanced_content JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index for drug_content
CREATE INDEX IF NOT EXISTS idx_drug_content_drug_id ON drug_content(drug_id);

-- Create trigger for drug_content
CREATE TRIGGER update_drug_content_updated_at BEFORE UPDATE ON drug_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure all columns exist in seo_metadata
ALTER TABLE seo_metadata 
    ADD COLUMN IF NOT EXISTS meta_description TEXT,
    ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- Add any missing columns to drugs table
ALTER TABLE drugs
    ADD COLUMN IF NOT EXISTS label JSONB;