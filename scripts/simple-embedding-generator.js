const { Client } = require('pg');
// Use built-in fetch for Node.js 18+
const fetch = globalThis.fetch || require('node-fetch');

// Simple embedding generation script
async function generateEmbeddings() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'pharmaiq_db',
    user: 'pharmaiq',
    password: 'pharmaiq_dev',
  });

  console.log('Connecting to database...');
  await client.connect();

  try {
    // Check if we need OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY environment variable not set');
      return;
    }

    // Get all drugs without embeddings
    const { rows: drugs } = await client.query(`
      SELECT d.id, d.set_id, d.drug_name, d.generic_name, d.manufacturer, d.label_data
      FROM drugs d
      LEFT JOIN drug_embeddings de ON d.id = de.drug_id
      WHERE de.drug_id IS NULL
      LIMIT 10
    `);

    console.log(`Found ${drugs.length} drugs without embeddings`);

    let successCount = 0;
    let errorCount = 0;

    for (const drug of drugs) {
      try {
        console.log(`Generating embeddings for: ${drug.drug_name}`);

        // Generate content for embedding
        const contents = [
          {
            type: 'summary',
            text: `${drug.drug_name} manufactured by ${drug.manufacturer}. ${drug.generic_name ? `Generic: ${drug.generic_name}. ` : ''}${drug.label_data?.indicationsAndUsage || 'Prescription medication.'}`
          },
          {
            type: 'indications',
            text: drug.label_data?.indicationsAndUsage || 'No indications available'
          },
          {
            type: 'full_label',
            text: JSON.stringify(drug.label_data || {})
          }
        ];

        for (const content of contents) {
          // Generate embedding via OpenAI
          const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              input: content.text.substring(0, 8000), // Limit text length
              model: 'text-embedding-3-small'
            })
          });

          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
          }

          const result = await response.json();
          const embedding = result.data[0].embedding;

          // Insert embedding into database
          await client.query(`
            INSERT INTO drug_embeddings (drug_id, content_type, content_text, embedding, model_name)
            VALUES ($1, $2, $3, $4::vector, $5)
            ON CONFLICT (drug_id, content_type) 
            DO UPDATE SET 
              content_text = EXCLUDED.content_text,
              embedding = EXCLUDED.embedding,
              model_name = EXCLUDED.model_name,
              updated_at = CURRENT_TIMESTAMP
          `, [drug.id, content.type, content.text, JSON.stringify(embedding), 'text-embedding-3-small']);

          console.log(`  ✅ Generated ${content.type} embedding`);
        }

        successCount++;
        console.log(`✅ Completed ${drug.drug_name} (${successCount}/${drugs.length})`);

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ Failed for ${drug.drug_name}:`, error.message);
        errorCount++;
      }
    }

    // Show final stats
    const { rows: stats } = await client.query(`
      SELECT 
        content_type,
        COUNT(*) as count
      FROM drug_embeddings 
      GROUP BY content_type
    `);

    console.log('\n🎉 Embedding generation completed!');
    console.log(`📊 Results: ${successCount} success, ${errorCount} errors`);
    console.log('📈 Current embeddings in database:');
    stats.forEach(stat => {
      console.log(`  - ${stat.content_type}: ${stat.count}`);
    });

  } finally {
    await client.end();
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  generateEmbeddings().catch(console.error);
}

module.exports = { generateEmbeddings };