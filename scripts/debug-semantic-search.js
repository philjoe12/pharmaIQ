const { Client } = require('pg');
const fetch = globalThis.fetch || require('node-fetch');

async function debugSemanticSearch() {
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

    // First, let's check what we have in the database
    console.log('🔍 Database inspection:');
    
    const drugCount = await client.query('SELECT COUNT(*) FROM drugs');
    console.log(`📋 Total drugs: ${drugCount.rows[0].count}`);
    
    const embeddingCount = await client.query('SELECT content_type, COUNT(*) FROM drug_embeddings GROUP BY content_type');
    console.log('📊 Embeddings by type:');
    embeddingCount.rows.forEach(row => {
      console.log(`  - ${row.content_type}: ${row.count}`);
    });

    // Test a simple query: "diabetes"
    const testQuery = 'diabetes';
    console.log(`\n🔍 Testing simple query: "${testQuery}"`);

    // Generate embedding for search
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: testQuery,
        model: 'text-embedding-3-small'
      })
    });

    const result = await response.json();
    const queryEmbedding = result.data[0].embedding;
    console.log(`✅ Generated query embedding (${queryEmbedding.length} dimensions)`);

    // Test with very low threshold (0.1) to see what we get
    console.log('\n🔍 Testing with very low threshold (0.1):');
    const searchResult = await client.query(`
      SELECT 
        d.drug_name,
        d.manufacturer,
        de.content_type,
        de.content_text,
        1 - (de.embedding <=> $1::vector) as similarity
      FROM drug_embeddings de
      INNER JOIN drugs d ON de.drug_id = d.id
      WHERE de.content_type = 'summary'
        AND de.embedding IS NOT NULL
        AND 1 - (de.embedding <=> $1::vector) >= 0.1
      ORDER BY de.embedding <=> $1::vector
      LIMIT 10
    `, [JSON.stringify(queryEmbedding)]);

    if (searchResult.rows.length > 0) {
      console.log(`✅ Found ${searchResult.rows.length} results:`);
      searchResult.rows.forEach((row, index) => {
        console.log(`\n  ${index + 1}. ${row.drug_name} (${row.manufacturer})`);
        console.log(`     Similarity: ${(row.similarity * 100).toFixed(2)}%`);
        console.log(`     Content: ${row.content_text.substring(0, 150)}...`);
      });
    } else {
      console.log('❌ No results even with 0.1 threshold');
    }

    // Let's also check if any of our drugs mention diabetes
    console.log('\n🔍 Checking which drugs mention diabetes:');
    const diabetesCheck = await client.query(`
      SELECT 
        d.drug_name,
        d.manufacturer,
        de.content_text,
        CASE 
          WHEN LOWER(de.content_text) LIKE '%diabetes%' THEN 'YES'
          WHEN LOWER(de.content_text) LIKE '%glucos%' THEN 'GLUCOSE-RELATED'
          WHEN LOWER(de.content_text) LIKE '%insulin%' THEN 'INSULIN-RELATED'
          ELSE 'NO'
        END as mentions_diabetes
      FROM drug_embeddings de
      INNER JOIN drugs d ON de.drug_id = d.id
      WHERE de.content_type = 'summary'
      ORDER BY d.drug_name
    `);

    diabetesCheck.rows.forEach(row => {
      console.log(`  - ${row.drug_name}: ${row.mentions_diabetes}`);
      if (row.mentions_diabetes !== 'NO') {
        console.log(`    Content: ${row.content_text.substring(0, 100)}...`);
      }
    });

  } finally {
    await client.end();
  }
}

// Run the debug test
if (require.main === module) {
  debugSemanticSearch().catch(console.error);
}

module.exports = { debugSemanticSearch };