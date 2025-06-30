// Simple OpenAI API Test
const readline = require('readline');

console.log('🤖 OpenAI API Feature Test\n');

async function testOpenAI(apiKey) {
  try {
    // Dynamic import for OpenAI (ES module)
    const { OpenAI } = await import('openai');
    
    const openai = new OpenAI({
      apiKey: apiKey
    });

    console.log('✅ OpenAI client initialized successfully');
    
    // Test 1: SEO Title Generation
    console.log('\n📝 Testing SEO Title Generation...');
    const titleResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert creating drug information titles. Create SEO-optimized titles under 60 characters that include the drug name and primary indication. Do not provide medical advice.'
        },
        {
          role: 'user',
          content: 'Create an SEO title for Taltz (ixekizumab), a prescription medication for moderate-to-severe plaque psoriasis manufactured by Eli Lilly and Company.'
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    const seoTitle = titleResponse.choices[0].message.content.trim();
    console.log('✅ SEO Title:', seoTitle);
    console.log('   Length:', seoTitle.length, 'characters');
    console.log('   Under 60 chars:', seoTitle.length <= 60 ? '✅' : '❌');

    // Test 2: Meta Description Generation
    console.log('\n📄 Testing Meta Description Generation...');
    const descResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert creating meta descriptions for drug information pages. Create descriptions 150-160 characters that summarize the drug, indication, and manufacturer. Include action words like "learn" or "discover". Do not provide medical advice.'
        },
        {
          role: 'user',
          content: 'Create a meta description for Taltz (ixekizumab) for moderate-to-severe plaque psoriasis from Eli Lilly. Include prescribing information and safety data mention.'
        }
      ],
      max_tokens: 150,
      temperature: 0.7
    });

    const metaDesc = descResponse.choices[0].message.content.trim();
    console.log('✅ Meta Description:', metaDesc);
    console.log('   Length:', metaDesc.length, 'characters');
    console.log('   150-160 range:', (metaDesc.length >= 150 && metaDesc.length <= 160) ? '✅' : '⚠️');

    // Test 3: FAQ Generation
    console.log('\n❓ Testing FAQ Generation...');
    const faqResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a medical information specialist creating patient FAQs. Generate 3 common questions and answers about the drug. Always include disclaimers to consult healthcare providers. Do not provide specific medical advice or dosing instructions.'
        },
        {
          role: 'user',
          content: 'Create 3 FAQ items for Taltz (ixekizumab) for psoriasis. Include questions about what it is, how it works, and common side effects. Always direct patients to consult their healthcare provider.'
        }
      ],
      max_tokens: 400,
      temperature: 0.7
    });

    const faqContent = faqResponse.choices[0].message.content.trim();
    console.log('✅ FAQ Content:');
    console.log(faqContent);

    // Test 4: Content Quality Check
    console.log('\n🔍 Testing Content Quality Analysis...');
    const qualityResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a content quality analyzer. Rate the following content on a scale of 1-100 for medical accuracy, clarity, and appropriateness. Return only a number and brief explanation.'
        },
        {
          role: 'user',
          content: `Analyze this content: "${seoTitle}"\n\nRate its quality for a drug information website.`
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    });

    const qualityScore = qualityResponse.choices[0].message.content.trim();
    console.log('✅ Quality Analysis:', qualityScore);

    console.log('\n🎉 All OpenAI Features Tested Successfully!');
    console.log('\n📊 Test Summary:');
    console.log(`   ✅ API Connection: Working`);
    console.log(`   ✅ SEO Title: ${seoTitle.length} chars`);
    console.log(`   ✅ Meta Description: ${metaDesc.length} chars`);
    console.log(`   ✅ FAQ Generation: Working`);
    console.log(`   ✅ Quality Analysis: Working`);
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Integrate these prompts into the AI worker service');
    console.log('   2. Add content validation and safety checks');
    console.log('   3. Implement fallback mechanisms for API failures');
    console.log('   4. Set up monitoring for API usage and costs');

  } catch (error) {
    console.error('❌ OpenAI Test Failed:', error.message);
    
    if (error.code === 'invalid_api_key') {
      console.log('\n💡 API Key Issue:');
      console.log('   - Check that your API key is correct');
      console.log('   - Verify your OpenAI account has credits');
      console.log('   - Ensure the key has proper permissions');
    } else if (error.code === 'insufficient_quota') {
      console.log('\n💰 Quota Issue:');
      console.log('   - Add credits to your OpenAI account');
      console.log('   - Check your usage limits');
    } else {
      console.log('\n🔧 Other Issues:');
      console.log('   - Check your internet connection');
      console.log('   - Verify OpenAI service status');
    }
  }
}

// Get API key from user
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
  console.log('🔑 Using API key from environment variable\n');
  testOpenAI(process.env.OPENAI_API_KEY).finally(() => rl.close());
} else {
  console.log('🔑 OpenAI API key needed to test AI features.');
  console.log('   Get your key from: https://platform.openai.com/api-keys');
  console.log('   Note: This will make real API calls and consume credits.\n');
  
  rl.question('Enter your OpenAI API key (or press Enter to skip): ', (apiKey) => {
    if (apiKey && apiKey.startsWith('sk-')) {
      console.log('\n🚀 Starting OpenAI tests...\n');
      testOpenAI(apiKey).finally(() => rl.close());
    } else {
      console.log('❌ No valid API key provided. Skipping AI tests.');
      console.log('\n📝 To test later, run: OPENAI_API_KEY="your-key" node test-openai-simple.js');
      rl.close();
    }
  });
}