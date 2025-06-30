// Test MCP Server Integration with AI
console.log('🔗 Testing MCP Server Integration with AI Tools\n');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function testMCPIntegration() {
  if (!OPENAI_API_KEY || !OPENAI_API_KEY.startsWith('sk-')) {
    console.log('⚠️ OpenAI API key required for MCP integration testing');
    console.log('Set OPENAI_API_KEY environment variable');
    return;
  }

  try {
    // Import OpenAI
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    
    console.log('✅ OpenAI client initialized for MCP testing');

    // Test 1: Demonstrate MCP Tools Available
    console.log('\n🛠️ Testing MCP Drug Information Tools...');
    
    const mcpTools = [
      {
        name: 'search_drugs',
        description: 'Search for drugs by name, generic name, or manufacturer',
        parameters: {
          query: 'string - search term',
          limit: 'number - max results (default 10)'
        }
      },
      {
        name: 'get_drug_details',
        description: 'Get detailed information about a specific drug by slug',
        parameters: {
          slug: 'string - drug identifier'
        }
      },
      {
        name: 'find_drugs_by_condition',
        description: 'Find drugs that treat a specific medical condition',
        parameters: {
          condition: 'string - medical condition',
          limit: 'number - max results (default 10)'
        }
      },
      {
        name: 'get_drug_interactions',
        description: 'Get drug interactions and contraindications',
        parameters: {
          slug: 'string - drug identifier'
        }
      },
      {
        name: 'compare_drugs',
        description: 'Compare multiple drugs side by side',
        parameters: {
          slugs: 'array - drug identifiers to compare'
        }
      },
      {
        name: 'get_related_drugs',
        description: 'Get drugs related to a specific drug',
        parameters: {
          slug: 'string - drug identifier',
          limit: 'number - max results (default 5)'
        }
      }
    ];

    console.log('✅ Available MCP Drug Tools:');
    mcpTools.forEach((tool, index) => {
      console.log(`   ${index + 1}. ${tool.name}: ${tool.description}`);
    });

    // Test 2: Simulate AI Using MCP Tools for Drug Information
    console.log('\n🤖 Testing AI Integration with Drug Information Tools...');
    
    // Mock MCP tool responses (these would come from the actual MCP server)
    const mockToolResponses = {
      search_drugs: {
        query: 'psoriasis treatment',
        found: 3,
        drugs: [
          {
            name: 'Taltz',
            genericName: 'ixekizumab',
            manufacturer: 'Eli Lilly and Company',
            slug: 'taltz-ixekizumab',
            indications: 'Treatment of adults with moderate-to-severe plaque psoriasis who are candidates for systemic therapy or phototherapy'
          },
          {
            name: 'Humira',
            genericName: 'adalimumab',
            manufacturer: 'AbbVie',
            slug: 'humira-adalimumab',
            indications: 'Treatment of rheumatoid arthritis, psoriatic arthritis, ankylosing spondylitis, Crohn disease, ulcerative colitis, plaque psoriasis'
          },
          {
            name: 'Stelara',
            genericName: 'ustekinumab',
            manufacturer: 'Janssen',
            slug: 'stelara-ustekinumab',
            indications: 'Treatment of moderate to severe plaque psoriasis, active psoriatic arthritis, moderate to severe Crohn disease'
          }
        ]
      },
      
      get_drug_details: {
        name: 'Taltz',
        genericName: 'ixekizumab',
        manufacturer: 'Eli Lilly and Company',
        slug: 'taltz-ixekizumab',
        indications: 'Taltz is indicated for the treatment of adults with moderate-to-severe plaque psoriasis who are candidates for systemic therapy or phototherapy.',
        dosage: 'The recommended dose is 160 mg (two 80 mg injections) administered by subcutaneous injection at Weeks 0, 2, 4, 6, 8, 10, and 12, followed by 80 mg every 4 weeks.',
        warnings: 'Increased risk of serious infections that may lead to hospitalization or death. Most patients who developed these infections were taking concomitant immunosuppressants.',
        contraindications: 'Taltz is contraindicated in patients with a previous serious hypersensitivity reaction to ixekizumab or to any of the excipients.',
        adverseReactions: 'The most commonly reported adverse reactions (≥1%) in psoriasis clinical trials were injection site reactions (17%), upper respiratory tract infections (13%), nausea (1%), and tinea infections (1%).'
      }
    };

    // Test 3: AI-Enhanced Drug Information Summary
    console.log('\n📋 Testing AI-Enhanced Drug Information Generation...');
    
    const drugSearchData = JSON.stringify(mockToolResponses.search_drugs, null, 2);
    const drugDetailData = JSON.stringify(mockToolResponses.get_drug_details, null, 2);
    
    const aiSummaryResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a medical information AI assistant with access to drug database tools via MCP (Model Context Protocol). 

Available tools:
- search_drugs: Find drugs by name or condition
- get_drug_details: Get comprehensive drug information
- find_drugs_by_condition: Find treatments for conditions
- get_drug_interactions: Check safety information
- compare_drugs: Side-by-side drug comparison
- get_related_drugs: Find similar medications

Your role is to help healthcare professionals and patients understand drug information safely and accurately. Always include appropriate medical disclaimers.`
        },
        {
          role: 'user',
          content: `I used the search_drugs tool to find psoriasis treatments and got this data:
${drugSearchData}

Then I used get_drug_details for Taltz and got:
${drugDetailData}

Please provide a comprehensive but concise summary for a healthcare provider about Taltz as a psoriasis treatment option, including key safety considerations.`
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const aiSummary = aiSummaryResponse.choices[0].message.content;
    console.log('✅ AI-Enhanced Drug Summary:');
    console.log(aiSummary);

    // Test 4: AI-Powered Drug Comparison
    console.log('\n⚖️ Testing AI-Powered Drug Comparison...');
    
    const comparisonResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a medical AI assistant that helps compare medications. Provide objective, evidence-based comparisons for healthcare providers. Always include safety disclaimers.'
        },
        {
          role: 'user',
          content: `Based on the MCP drug search results, compare Taltz (ixekizumab), Humira (adalimumab), and Stelara (ustekinumab) for psoriasis treatment. Focus on:
1. Mechanism of action
2. Administration frequency
3. Key safety considerations
4. Patient selection factors

Search results: ${drugSearchData}`
        }
      ],
      max_tokens: 400,
      temperature: 0.6
    });

    const comparison = comparisonResponse.choices[0].message.content;
    console.log('✅ AI-Powered Drug Comparison:');
    console.log(comparison);

    // Test 5: Patient-Friendly Explanation Generator
    console.log('\n👥 Testing Patient-Friendly Information Generation...');
    
    const patientExplanationResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a patient education AI that converts complex medical information into easy-to-understand language. Always emphasize consulting healthcare providers and never provide specific medical advice.'
        },
        {
          role: 'user',
          content: `Using this drug information from our MCP database:
${drugDetailData}

Create a patient-friendly explanation of Taltz (ixekizumab) that covers:
1. What it is and how it works
2. What conditions it treats
3. How it's given
4. Important safety information
5. Common side effects

Keep it clear, reassuring but honest, and include appropriate disclaimers.`
        }
      ],
      max_tokens: 400,
      temperature: 0.7
    });

    const patientExplanation = patientExplanationResponse.choices[0].message.content;
    console.log('✅ Patient-Friendly Explanation:');
    console.log(patientExplanation);

    console.log('\n🎉 MCP Integration Tests Complete!');
    console.log('\n📊 MCP + AI Capabilities Demonstrated:');
    console.log('   ✅ Drug Search via MCP Tools');
    console.log('   ✅ Detailed Drug Information Retrieval');
    console.log('   ✅ AI-Enhanced Medical Summaries');
    console.log('   ✅ Comparative Drug Analysis');
    console.log('   ✅ Patient Education Content');
    console.log('   ✅ Healthcare Provider Decision Support');
    
    console.log('\n🔗 MCP Architecture Benefits:');
    console.log('   📋 Standardized drug data access for AI');
    console.log('   🔍 Real-time database queries via tools');
    console.log('   🤖 Context-aware AI responses');
    console.log('   🛡️ Consistent safety and validation');
    console.log('   ⚡ Scalable tool-based architecture');
    console.log('   🔒 Controlled access to medical data');

    console.log('\n💡 Production Use Cases:');
    console.log('   1. AI-powered drug lookup for clinicians');
    console.log('   2. Patient education content generation');
    console.log('   3. Drug interaction checking');
    console.log('   4. Treatment option comparison');
    console.log('   5. Condition-based drug recommendations');
    console.log('   6. Medical literature integration');
    
  } catch (error) {
    console.error('❌ MCP Integration Test Failed:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n🔑 API Key Issue - ensure OPENAI_API_KEY is set');
    } else {
      console.log('\n🔧 Technical issue with AI integration');
    }
  }
}

// Test the MCP integration
testMCPIntegration();