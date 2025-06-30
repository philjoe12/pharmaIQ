#!/bin/bash
set -e

echo "=== PharmaIQ Database Seed Script ==="
echo "Starting database seeding process..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_NAME="${DATABASE_NAME:-pharmaiq_db}"
DB_USER="${DATABASE_USERNAME:-pharmaiq}"
DB_PASSWORD="${DATABASE_PASSWORD:-pharmaiq_dev}"

# Function to execute SQL
execute_sql() {
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "$1"
}

# Function to check if database is ready
wait_for_db() {
    echo -e "${YELLOW}Waiting for database to be ready...${NC}"
    for i in {1..30}; do
        if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; then
            echo -e "${GREEN}Database is ready!${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
    done
    echo -e "${RED}Database connection timeout${NC}"
    exit 1
}

# Wait for database
wait_for_db

# Check if data already exists
DRUG_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM drugs;" 2>/dev/null || echo "0")
DRUG_COUNT=$(echo $DRUG_COUNT | xargs)

if [ "$DRUG_COUNT" -gt "0" ]; then
    echo -e "${YELLOW}Database already contains $DRUG_COUNT drugs. Skipping seed...${NC}"
    echo "To reseed, run: ./infrastructure/docker/scripts/reset-db.sh first"
    exit 0
fi

echo -e "${GREEN}Starting data seed...${NC}"

# Create Node.js seed script
cat > /tmp/seed-pharmaiq.js << 'EOF'
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const pool = new Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'pharmaiq',
    user: process.env.DATABASE_USERNAME || 'pharmaiq_user',
    password: process.env.DATABASE_PASSWORD || 'pharmaiq_dev_password',
});

// Load FDA label data
const labelsPath = path.join(__dirname, '../services/api-gateway/Labels.json');
const labels = JSON.parse(fs.readFileSync(labelsPath, 'utf8'));

async function seedDatabase() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log(`Seeding ${labels.length} drug labels...`);
        
        for (const labelData of labels) {
            // Insert drug
            const drugResult = await client.query(`
                INSERT INTO drugs (
                    id, brand_name, generic_name, manufacturer, active_ingredient,
                    drug_class, route_of_administration, strength, dosage_form,
                    fda_application_number, slug, status, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', NOW(), NOW()
                ) RETURNING id
            `, [
                labelData.drugName || labelData.label.title,
                labelData.label.genericName,
                labelData.labeler || labelData.label.labelerName,
                labelData.label.genericName, // Active ingredient (simplified)
                labelData.label.productType,
                'oral', // Default, should be extracted from label
                'varies', // Should be extracted from dosage forms
                labelData.label.dosageFormsAndStrengths?.substring(0, 100) || 'See label',
                labelData.label.applicationNumber || 'N/A',
                labelData.slug
            ]);
            
            const drugId = drugResult.rows[0].id;
            
            // Insert drug content sections
            const sections = [
                { type: 'indications', title: 'Indications and Usage', 
                  content: labelData.label.indicationsAndUsage || '', order: 1 },
                { type: 'dosage', title: 'Dosage and Administration', 
                  content: labelData.label.dosageAndAdministration || '', order: 2 },
                { type: 'warnings', title: 'Warnings and Precautions', 
                  content: labelData.label.warningsAndPrecautions || '', order: 3 },
                { type: 'adverse_reactions', title: 'Adverse Reactions', 
                  content: labelData.label.adverseReactions || '', order: 4 },
                { type: 'clinical_pharmacology', title: 'Clinical Pharmacology', 
                  content: labelData.label.clinicalPharmacology || '', order: 5 },
                { type: 'clinical_studies', title: 'Clinical Studies', 
                  content: labelData.label.clinicalStudies || '', order: 6 }
            ];
            
            for (const section of sections) {
                if (section.content) {
                    // Clean HTML content
                    const cleanContent = section.content
                        .replace(/<[^>]*>/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();
                    
                    await client.query(`
                        INSERT INTO drug_content (
                            id, drug_id, content_type, title, original_content,
                            simplified_content, display_order, is_active, created_at, updated_at
                        ) VALUES (
                            gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, NOW(), NOW()
                        )
                    `, [drugId, section.type, section.title, section.content, cleanContent, section.order]);
                }
            }
            
            // Insert SEO metadata (placeholder for now)
            await client.query(`
                INSERT INTO seo_metadata (
                    id, drug_id, page_title, meta_description, canonical_url,
                    schema_markup, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW()
                )
            `, [
                drugId,
                `${labelData.drugName} - Drug Information | PharmaIQ`,
                `Learn about ${labelData.drugName} (${labelData.label.genericName}), including uses, dosage, side effects, and warnings.`,
                `/drugs/${labelData.slug}`,
                JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Drug",
                    "name": labelData.drugName,
                    "genericName": labelData.label.genericName
                })
            ]);
            
            console.log(` Seeded ${labelData.drugName}`);
        }
        
        await client.query('COMMIT');
        console.log(`\n Successfully seeded ${labels.length} drugs!`);
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('L Seed failed:', error);
        throw error;
    } finally {
        client.release();
        pool.end();
    }
}

seedDatabase().catch(console.error);
EOF

# Run the seed script
echo -e "${YELLOW}Running seed script...${NC}"
cd /pharmaIQ
node /tmp/seed-pharmaiq.js

# Clean up
rm /tmp/seed-pharmaiq.js

echo -e "${GREEN} Database seeding completed successfully!${NC}"

# Show summary
echo -e "\n${YELLOW}Database Summary:${NC}"
execute_sql "SELECT COUNT(*) as drug_count FROM drugs;" 2>/dev/null || true
execute_sql "SELECT COUNT(*) as content_count FROM drug_content;" 2>/dev/null || true
execute_sql "SELECT COUNT(*) as seo_count FROM seo_metadata;" 2>/dev/null || true

echo -e "\n${GREEN}You can now start the application with: docker-compose up${NC}"