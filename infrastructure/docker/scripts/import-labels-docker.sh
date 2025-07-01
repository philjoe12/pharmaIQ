#!/bin/bash
set -e

echo "=== PharmaIQ Labels Import Script ==="

# First, ensure the database tables exist
echo "Creating database tables..."
docker exec -i pharmaiq_postgres_1 psql -U pharmaiq -d pharmaiq_db < /pharmaIQ/infrastructure/docker/scripts/init-db.sql

# Create the missing drug_content table
echo "Creating drug_content table..."
docker exec -i pharmaiq_postgres_1 psql -U pharmaiq -d pharmaiq_db << 'EOF'
CREATE TABLE IF NOT EXISTS drug_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drug_id UUID NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
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
    UNIQUE(drug_id)
);

CREATE INDEX IF NOT EXISTS idx_drug_content_drug_id ON drug_content(drug_id);

-- Add trigger if function exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_drug_content_updated_at BEFORE UPDATE ON drug_content
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END$$;
EOF

# Now run a Node.js script inside the API container to import the data
echo "Importing drugs from Labels.json..."
docker exec pharmaiq_api_1 node -e "
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
    host: 'postgres',
    port: 5432,
    database: 'pharmaiq_db',
    user: 'pharmaiq',
    password: 'pharmaiq_dev',
});

async function importLabels() {
    const client = await pool.connect();
    
    try {
        // Read Labels.json
        const labelsData = JSON.parse(fs.readFileSync('/app/data/Labels.json', 'utf8'));
        console.log('Found ' + labelsData.length + ' drugs to import');
        
        let imported = 0;
        let errors = 0;
        
        for (const drug of labelsData) {
            try {
                // Insert into drugs table
                const drugResult = await client.query(
                    'INSERT INTO drugs (set_id, drug_name, generic_name, slug, manufacturer, status, label_data) ' +
                    'VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7) ' +
                    'ON CONFLICT (set_id) DO UPDATE ' +
                    'SET drug_name = EXCLUDED.drug_name, ' +
                    'generic_name = EXCLUDED.generic_name, ' +
                    'slug = EXCLUDED.slug, ' +
                    'manufacturer = EXCLUDED.manufacturer, ' +
                    'label_data = EXCLUDED.label_data, ' +
                    'updated_at = CURRENT_TIMESTAMP ' +
                    'RETURNING id',
                    [
                        drug.setId,
                        drug.drugName,
                        drug.label?.genericName || null,
                        drug.slug,
                        drug.labeler || drug.label?.labelerName || 'Unknown',
                        'published',
                        JSON.stringify(drug.label)
                    ]
                );
                
                const drugId = drugResult.rows[0].id;
                
                // Insert into drug_content
                await client.query(
                    'INSERT INTO drug_content (drug_id, title, description, indications, contraindications, dosage, warnings, \"sideEffects\") ' +
                    'VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8) ' +
                    'ON CONFLICT (drug_id) DO UPDATE ' +
                    'SET title = EXCLUDED.title, ' +
                    'description = EXCLUDED.description, ' +
                    'indications = EXCLUDED.indications, ' +
                    'contraindications = EXCLUDED.contraindications, ' +
                    'dosage = EXCLUDED.dosage, ' +
                    'warnings = EXCLUDED.warnings, ' +
                    '\"sideEffects\" = EXCLUDED.\"sideEffects\", ' +
                    'updated_at = CURRENT_TIMESTAMP',
                    [
                        drugId,
                        drug.drugName + ' - Drug Information',
                        drug.label?.description || 'Information about ' + drug.drugName,
                        drug.label?.indicationsAndUsage || null,
                        drug.label?.contraindications || null,
                        drug.label?.dosageAndAdministration || null,
                        drug.label?.warningsAndPrecautions || null,
                        drug.label?.adverseReactions || null
                    ]
                );
                
                // Insert SEO metadata
                await client.query(
                    'INSERT INTO seo_metadata (drug_id, title, meta_description, keywords) ' +
                    'VALUES (\$1, \$2, \$3, \$4) ' +
                    'ON CONFLICT (drug_id) DO UPDATE ' +
                    'SET title = EXCLUDED.title, ' +
                    'meta_description = EXCLUDED.meta_description, ' +
                    'keywords = EXCLUDED.keywords, ' +
                    'updated_at = CURRENT_TIMESTAMP',
                    [
                        drugId,
                        drug.drugName + ' | Drug Information, Side Effects & Dosage',
                        'Learn about ' + drug.drugName + ' (' + (drug.label?.genericName || 'generic') + '), including uses, dosage, side effects, and warnings.',
                        [drug.drugName, drug.label?.genericName, drug.labeler, 'drug information', 'side effects', 'dosage'].filter(Boolean)
                    ]
                );
                
                imported++;
                if (imported % 10 === 0) {
                    console.log('Imported ' + imported + ' drugs...');
                }
            } catch (error) {
                console.error('Error importing ' + drug.drugName + ':', error.message);
                errors++;
            }
        }
        
        console.log('Import complete!');
        console.log('Successfully imported: ' + imported + ' drugs');
        console.log('Errors: ' + errors);
        
    } catch (error) {
        console.error('Import failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

importLabels().catch(console.error);
"

echo "Import complete! Checking results..."
docker exec pharmaiq_postgres_1 psql -U pharmaiq -d postgres -c "SELECT COUNT(*) as total_drugs FROM drugs;"
docker exec pharmaiq_postgres_1 psql -U pharmaiq -d postgres -c "SELECT drug_name, slug FROM drugs LIMIT 5;"

echo "
You can now access drug pages at:
"
docker exec pharmaiq_postgres_1 psql -U pharmaiq -d postgres -t -c "SELECT 'http://localhost:3000/drugs/' || slug FROM drugs LIMIT 5;"