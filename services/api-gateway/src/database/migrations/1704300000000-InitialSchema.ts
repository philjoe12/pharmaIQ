import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1704300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable required extensions
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "vector"`);

    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE drug_status AS ENUM ('pending', 'processed', 'published', 'archived');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create drugs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS drugs (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        set_id VARCHAR(255) NOT NULL UNIQUE,
        drug_name VARCHAR(255) NOT NULL,
        generic_name VARCHAR(255),
        slug VARCHAR(255) NOT NULL UNIQUE,
        manufacturer VARCHAR(255) NOT NULL,
        status drug_status DEFAULT 'pending',
        label_data JSONB NOT NULL,
        processed_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create drug_content table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS drug_content (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        drug_id UUID NOT NULL UNIQUE,
        title VARCHAR(255),
        description TEXT,
        indications TEXT,
        contraindications TEXT,
        dosage TEXT,
        warnings TEXT,
        "sideEffects" TEXT,
        "enhancedContent" JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_drug_content_drug FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE
      )
    `);

    // Create drug_embeddings table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS drug_embeddings (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        drug_id UUID NOT NULL,
        field_name VARCHAR(100) NOT NULL,
        embedding vector(1536),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_drug_embeddings_drug FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE,
        UNIQUE(drug_id, field_name)
      )
    `);

    // Create seo_metadata table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS seo_metadata (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        drug_id UUID NOT NULL UNIQUE,
        page_title VARCHAR(255),
        meta_description TEXT,
        keywords TEXT[],
        canonical_url VARCHAR(500),
        og_title VARCHAR(255),
        og_description TEXT,
        og_image VARCHAR(500),
        structured_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_seo_metadata_drug FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE
      )
    `);

    // Create processing_logs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS processing_logs (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        drug_id UUID,
        task_type VARCHAR(100) NOT NULL,
        status processing_status DEFAULT 'pending',
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_processing_logs_drug FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE SET NULL
      )
    `);

    // Create indexes
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drugs_drug_name ON drugs USING gin(drug_name gin_trgm_ops)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drugs_generic_name ON drugs USING gin(generic_name gin_trgm_ops)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drugs_manufacturer ON drugs USING gin(manufacturer gin_trgm_ops)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drugs_status ON drugs(status)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drug_content_drug_id ON drug_content(drug_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drug_embeddings_drug_id ON drug_embeddings(drug_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drug_embeddings_field ON drug_embeddings(field_name)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_drug_embeddings_vector ON drug_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_processing_logs_drug_id ON processing_logs(drug_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_processing_logs_status ON processing_logs(status)`);

    // Create update trigger function
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Add update triggers
    await queryRunner.query(`
      CREATE TRIGGER update_drugs_updated_at BEFORE UPDATE ON drugs
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_drug_content_updated_at BEFORE UPDATE ON drug_content
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_seo_metadata_updated_at BEFORE UPDATE ON seo_metadata
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop triggers
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_seo_metadata_updated_at ON seo_metadata`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_drug_content_updated_at ON drug_content`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS update_drugs_updated_at ON drugs`);
    
    // Drop function
    await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column`);
    
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS processing_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS seo_metadata`);
    await queryRunner.query(`DROP TABLE IF EXISTS drug_embeddings`);
    await queryRunner.query(`DROP TABLE IF EXISTS drug_content`);
    await queryRunner.query(`DROP TABLE IF EXISTS drugs`);
    
    // Drop types
    await queryRunner.query(`DROP TYPE IF EXISTS processing_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS drug_status`);
  }
}