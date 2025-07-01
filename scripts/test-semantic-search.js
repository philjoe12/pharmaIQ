const { Client } = require('pg');
const fetch = globalThis.fetch || require('node-fetch');

async function testSemanticSearch() {
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
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY environment variable not set');
      return;
    }

    // Test queries
    const testQueries = [
      'diabetes medications',
      'cancer treatment drugs',
      'autoimmune disorders therapy',
      'migraine prevention',
      'weight loss medications'
    ];

    console.log('🔍 Testing semantic search functionality...\n');

    for (const query of testQueries) {
      console.log(`\n📝 Testing query: "${query}"`);
      
      try {
        // Generate embedding for the search query
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: query,
            model: 'text-embedding-3-small'
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const result = await response.json();
        const queryEmbedding = result.data[0].embedding;

        // Perform semantic search using cosine similarity
        const searchResult = await client.query(`
          SELECT 
            de.content_type,
            de.content_text,
            d.drug_name,
            d.manufacturer,
            d.generic_name,
            1 - (de.embedding <=> $1::vector) as similarity
          FROM drug_embeddings de
          INNER JOIN drugs d ON de.drug_id = d.id
          WHERE de.content_type = 'summary' 
            AND de.embedding IS NOT NULL
            AND 1 - (de.embedding <=> $1::vector) >= 0.5
          ORDER BY de.embedding <=> $1::vector
          LIMIT 5
        `, [JSON.stringify(queryEmbedding)]);

        if (searchResult.rows.length > 0) {
          console.log(`✅ Found ${searchResult.rows.length} relevant drugs:`);
          searchResult.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.drug_name} (${row.manufacturer})`);
            console.log(`     Similarity: ${(row.similarity * 100).toFixed(1)}%`);
            console.log(`     Content: ${row.content_text.substring(0, 100)}...`);
          });
        } else {
          console.log(`❌ No relevant drugs found (threshold: 50%)`);
        }

      } catch (error) {
        console.error(`❌ Error testing "${query}":`, error.message);
      }

      // Add delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test the embedding statistics
    console.log('\n📊 Embedding Statistics:');
    const stats = await client.query(`
      SELECT 
        content_type,
        COUNT(*) as count,
        AVG(array_length(embedding::text::json::text[]::numeric[], 1)) as avg_dimensions
      FROM drug_embeddings 
      GROUP BY content_type
      ORDER BY content_type
    `);

    stats.rows.forEach(stat => {
      console.log(`  - ${stat.content_type}: ${stat.count} embeddings (${stat.avg_dimensions} dimensions)`);
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

// Run the test
if (require.main === module) {
  testSemanticSearch().catch(console.error);
}

module.exports = { testSemanticSearch };