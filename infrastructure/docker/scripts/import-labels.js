const fs = require('fs');
const { Client } = require('pg');

async function importLabels() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'pharmaiq',
    password: 'pharmaiq_secure_password_2024',
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read the Labels.json file
    const labelsData = JSON.parse(fs.readFileSync('/pharmaIQ/data/Labels.json', 'utf8'));
    console.log(`Found ${labelsData.length} drugs to import`);

    // First ensure all tables exist
    await client.query(`
      -- Create the missing drug_content table
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
      
      -- Create index if not exists
      CREATE INDEX IF NOT EXISTS idx_drug_content_drug_id ON drug_content(drug_id);
    `);

    let imported = 0;
    let errors = 0;

    // Import each drug
    for (const drug of labelsData) {
      try {
        // Insert into drugs table
        const drugResult = await client.query(`
          INSERT INTO drugs (set_id, drug_name, generic_name, slug, manufacturer, status, label_data)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (set_id) DO UPDATE
          SET 
            drug_name = EXCLUDED.drug_name,
            generic_name = EXCLUDED.generic_name,
            slug = EXCLUDED.slug,
            manufacturer = EXCLUDED.manufacturer,
            label_data = EXCLUDED.label_data,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id
        `, [
          drug.setId,
          drug.drugName,
          drug.label?.genericName || null,
          drug.slug,
          drug.labeler || drug.label?.labelerName || 'Unknown',
          'published',
          JSON.stringify(drug.label)
        ]);

        const drugId = drugResult.rows[0].id;

        // Insert into drug_content table
        await client.query(`
          INSERT INTO drug_content (
            drug_id, 
            title, 
            description, 
            indications, 
            contraindications, 
            dosage, 
            warnings, 
            side_effects
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (drug_id) DO UPDATE
          SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            indications = EXCLUDED.indications,
            contraindications = EXCLUDED.contraindications,
            dosage = EXCLUDED.dosage,
            warnings = EXCLUDED.warnings,
            side_effects = EXCLUDED.side_effects,
            updated_at = CURRENT_TIMESTAMP
        `, [
          drugId,
          `${drug.drugName} - Comprehensive Drug Information`,
          drug.label?.description || `Information about ${drug.drugName}`,
          drug.label?.indicationsAndUsage || null,
          drug.label?.contraindications || null,
          drug.label?.dosageAndAdministration || null,
          drug.label?.warningsAndPrecautions || null,
          drug.label?.adverseReactions || null
        ]);

        // Insert SEO metadata
        await client.query(`
          INSERT INTO seo_metadata (drug_id, title, meta_description, keywords)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (drug_id) DO UPDATE
          SET
            title = EXCLUDED.title,
            meta_description = EXCLUDED.meta_description,
            keywords = EXCLUDED.keywords,
            updated_at = CURRENT_TIMESTAMP
        `, [
          drugId,
          `${drug.drugName} | Drug Information, Side Effects & Dosage`,
          `Learn about ${drug.drugName} (${drug.label?.genericName || 'generic'}), including uses, dosage, side effects, and warnings. ${drug.labeler ? `Manufactured by ${drug.labeler}.` : ''}`,
          [drug.drugName, drug.label?.genericName, drug.labeler, 'drug information', 'side effects', 'dosage'].filter(Boolean)
        ]);

        imported++;
        if (imported % 10 === 0) {
          console.log(`Imported ${imported} drugs...`);
        }
      } catch (error) {
        console.error(`Error importing drug ${drug.drugName}:`, error.message);
        errors++;
      }
    }

    console.log(`\nImport complete!`);
    console.log(`Successfully imported: ${imported} drugs`);
    console.log(`Errors: ${errors}`);

  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await client.end();
  }
}

// Run the import
importLabels().catch(console.error);