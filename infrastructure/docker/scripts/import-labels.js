const fs = require('fs');
const { Client } = require('pg');

async function importLabels() {
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    user: process.env.DATABASE_USER || 'pharmaiq',
    password: process.env.DATABASE_PASSWORD || 'pharmaiq_dev',
    database: process.env.DATABASE_NAME || 'pharmaiq_db'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read the Labels.json file using relative path from the container's working directory
    const labelsData = JSON.parse(fs.readFileSync('/app/data/Labels.json', 'utf8'));
    console.log(`Found ${labelsData.length} drugs to import`);

    // Check if tables exist (TypeORM should have created them)
    const tablesExist = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'drugs'
      );
    `);
    
    if (!tablesExist.rows[0].exists) {
      throw new Error('Database tables not found. Please run migrations first.');
    }

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
            "sideEffects"
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
            "sideEffects" = EXCLUDED."sideEffects",
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