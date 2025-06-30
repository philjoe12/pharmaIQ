#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Create extensions if needed
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Create basic tables (these will be managed by TypeORM migrations in production)
    CREATE TABLE IF NOT EXISTS drugs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        generic_name VARCHAR(255),
        manufacturer VARCHAR(255),
        ndc_code VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS drug_labels (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        drug_id UUID REFERENCES drugs(id),
        raw_data JSONB NOT NULL,
        processed_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS ai_enhanced_content (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        drug_id UUID REFERENCES drugs(id),
        content_type VARCHAR(100) NOT NULL,
        original_content TEXT,
        enhanced_content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Insert some sample data for testing
    INSERT INTO drugs (name, generic_name, manufacturer) VALUES 
        ('Lipitor', 'Atorvastatin', 'Pfizer'),
        ('Metformin', 'Metformin HCl', 'Various')
    ON CONFLICT DO NOTHING;
    
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;
EOSQL

echo "Database initialization completed."