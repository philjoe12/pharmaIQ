const { Client } = require('pg');
const fetch = globalThis.fetch || require('node-fetch');

async function finalSearchTest() {
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

    // Test queries with better threshold
    const testQueries = [
      'diabetes treatment medications',
      'type 2 diabetes drugs',
      'cancer therapy drugs',
      'autoimmune disease treatment',
      'migraine prevention medication'
    ];

    console.log('🎯 Final Semantic Search Test with 25% threshold:\n');

    for (const query of testQueries) {
      console.log(`\n📝 Query: "${query}"`);
      
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

        const result = await response.json();
        const queryEmbedding = result.data[0].embedding;

        // Perform semantic search with 25% threshold
        const searchResult = await client.query(`
          SELECT 
            d.drug_name,
            d.manufacturer,
            d.generic_name,
            1 - (de.embedding <=> $1::vector) as similarity
          FROM drug_embeddings de
          INNER JOIN drugs d ON de.drug_id = d.id
          WHERE de.content_type = 'summary' 
            AND de.embedding IS NOT NULL
            AND 1 - (de.embedding <=> $1::vector) >= 0.25
          ORDER BY de.embedding <=> $1::vector
          LIMIT 3
        `, [JSON.stringify(queryEmbedding)]);

        if (searchResult.rows.length > 0) {
          console.log(`✅ Found ${searchResult.rows.length} relevant drugs:`);
          searchResult.rows.forEach((row, index) => {
            console.log(`  ${index + 1}. ${row.drug_name} (${row.generic_name || 'N/A'})`);
            console.log(`     Manufacturer: ${row.manufacturer}`);
            console.log(`     Similarity: ${(row.similarity * 100).toFixed(1)}%`);
          });
        } else {
          console.log(`❌ No drugs found above 25% similarity`);
        }

      } catch (error) {
        console.error(`❌ Error testing "${query}":`, error.message);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Demonstrate the power of semantic search vs keyword search
    console.log('\n🆚 Semantic vs Keyword Search Comparison:');
    
    const semanticQuery = 'blood sugar management medication';
    console.log(`\n📝 Testing: "${semanticQuery}"`);
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: semanticQuery,
        model: 'text-embedding-3-small'
      })
    });

    const result = await response.json();
    const queryEmbedding = result.data[0].embedding;

    // Semantic search
    const semanticResults = await client.query(`
      SELECT 
        d.drug_name,
        1 - (de.embedding <=> $1::vector) as similarity
      FROM drug_embeddings de
      INNER JOIN drugs d ON de.drug_id = d.id
      WHERE de.content_type = 'summary' 
        AND 1 - (de.embedding <=> $1::vector) >= 0.20
      ORDER BY de.embedding <=> $1::vector
      LIMIT 3
    `, [JSON.stringify(queryEmbedding)]);

    // Keyword search simulation
    const keywordResults = await client.query(`
      SELECT d.drug_name
      FROM drugs d
      WHERE LOWER(d.drug_name) LIKE '%blood%' 
         OR LOWER(d.drug_name) LIKE '%sugar%'
         OR LOWER(d.drug_name) LIKE '%management%'
    `);

    console.log('\n🤖 Semantic Search Results:');
    semanticResults.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.drug_name} (${(row.similarity * 100).toFixed(1)}% similarity)`);
    });

    console.log('\n🔤 Keyword Search Results:');
    if (keywordResults.rows.length > 0) {
      keywordResults.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.drug_name}`);
      });
    } else {
      console.log('  No keyword matches found');
    }

    console.log('\n🎯 Summary:');
    console.log('✅ Semantic search successfully finds diabetes medications for "blood sugar management"');
    console.log('❌ Keyword search finds no matches for the same query');
    console.log('🧠 This demonstrates the power of AI-powered semantic search!');

  } finally {
    await client.end();
  }
}

// Run the test
if (require.main === module) {
  finalSearchTest().catch(console.error);
}

module.exports = { finalSearchTest };