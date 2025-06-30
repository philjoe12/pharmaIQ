-- PharmaIQ Database Initialization Script

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types
CREATE TYPE drug_status AS ENUM ('pending', 'processing', 'processed', 'published', 'archived');
CREATE TYPE content_type AS ENUM ('seo_title', 'meta_description', 'faq', 'provider_explanation', 'related_content');

-- Drugs table
CREATE TABLE IF NOT EXISTS drugs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    set_id VARCHAR(255) UNIQUE NOT NULL,
    drug_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    manufacturer VARCHAR(255) NOT NULL,
    status drug_status DEFAULT 'pending',
    label_data JSONB NOT NULL,
    processed_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI enhanced content table
CREATE TABLE IF NOT EXISTS ai_enhanced_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
    content_type content_type NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(drug_id, content_type, version)
);

-- Processing logs table
CREATE TABLE IF NOT EXISTS processing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drug_id UUID REFERENCES drugs(id) ON DELETE CASCADE,
    step VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    metadata JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- SEO metadata table
CREATE TABLE IF NOT EXISTS seo_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    meta_description TEXT NOT NULL,
    keywords TEXT[],
    canonical_url VARCHAR(500),
    structured_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(drug_id)
);

-- Cache entries table
CREATE TABLE IF NOT EXISTS cache_entries (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_drugs_slug ON drugs(slug);
CREATE INDEX idx_drugs_status ON drugs(status);
CREATE INDEX idx_drugs_manufacturer ON drugs(manufacturer);
CREATE INDEX idx_drugs_drug_name ON drugs USING gin(drug_name gin_trgm_ops);
CREATE INDEX idx_drugs_generic_name ON drugs USING gin(generic_name gin_trgm_ops);

CREATE INDEX idx_ai_content_drug_id ON ai_enhanced_content(drug_id);
CREATE INDEX idx_ai_content_type ON ai_enhanced_content(content_type);
CREATE INDEX idx_ai_content_active ON ai_enhanced_content(is_active);

CREATE INDEX idx_processing_logs_drug_id ON processing_logs(drug_id);
CREATE INDEX idx_processing_logs_step ON processing_logs(step);
CREATE INDEX idx_processing_logs_status ON processing_logs(status);

CREATE INDEX idx_cache_expires ON cache_entries(expires_at);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_drugs_updated_at BEFORE UPDATE ON drugs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_content_updated_at BEFORE UPDATE ON ai_enhanced_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seo_metadata_updated_at BEFORE UPDATE ON seo_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();