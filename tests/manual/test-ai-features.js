Whats// Test AI Features with Real OpenAI API
// Run with: node tests/manual/test-ai-features.js

import { ContentEnhancementProcessor } from '../../services/ai-worker/src/processors/content-enhancement.processor.js';
import { SEOTitlePrompt } from '../../services/ai-worker/src/prompts/templates/seo-title.prompt.js';
import { MetaDescriptionPrompt } from '../../services/ai-worker/src/prompts/templates/meta-description.prompt.js';
import { FAQGenerationPrompt } from '../../services/ai-worker/src/prompts/templates/faq-generation.prompt.js';

console.log('🤖 Testing AI Features with Real OpenAI API...\n');

// Test data - real FDA drug information
const testDrugData = {
  drugName: 'Taltz',
  genericName: 'ixekizumab',
  manufacturer: 'Eli Lilly and Company',
  label: {
    indicationsAndUsage: 'Taltz is indicated for the treatment of adults with moderate-to-severe plaque psoriasis who are candidates for systemic therapy or phototherapy.',
    dosageAndAdministration: 'The recommended dose is 160 mg (two 80 mg injections) administered by subcutaneous injection at Weeks 0, 2, 4, 6, 8, 10, and 12, followed by 80 mg every 4 weeks.',
    warningsAndPrecautions: 'Increased risk of serious infections that may lead to hospitalization or death. Most patients who developed these infections were taking concomitant immunosuppressants such as methotrexate or corticosteroids.',
    contraindications: 'Taltz is contraindicated in patients with a previous serious hypersensitivity reaction to ixekizumab or to any of the excipients in Taltz.',
    adverseReactions: 'The most commonly reported adverse reactions (≥1%) in psoriasis clinical trials were injection site reactions (17%), upper respiratory tract infections (13%), nausea (1%), and tinea infections (1%).'
  }
};

async function testAIFeatures() {
  try {
    console.log('🔧 Initializing AI Content Enhancement Processor...');
    const processor = new ContentEnhancementProcessor();
    
    // Test 1: SEO Title Generation
    console.log('\n📝 Testing SEO Title Generation...');
    const titleRequest = {
      drugData: testDrugData,
      contentType: 'seo-title',
      targetAudience: 'general',
      options: { maxLength: 60 }
    };
    
    const titleResult = await processor.enhanceContent(titleRequest);
    console.log('✅ SEO Title Generated:', titleResult.content);
    console.log('   Length:', titleResult.content.length, 'characters');
    console.log('   Quality Score:', titleResult.qualityScore);
    
    // Test 2: Meta Description Generation
    console.log('\n📄 Testing Meta Description Generation...');
    const descriptionRequest = {
      drugData: testDrugData,
      contentType: 'meta-description',
      targetAudience: 'general',
      options: { maxLength: 160 }
    };
    
    const descriptionResult = await processor.enhanceContent(descriptionRequest);
    console.log('✅ Meta Description Generated:', descriptionResult.content);
    console.log('   Length:', descriptionResult.content.length, 'characters');
    console.log('   Quality Score:', descriptionResult.qualityScore);
    
    // Test 3: FAQ Generation
    console.log('\n❓ Testing FAQ Generation...');
    const faqRequest = {
      drugData: testDrugData,
      contentType: 'faq-generation',
      targetAudience: 'patient',
      options: { numberOfQuestions: 5 }
    };
    
    const faqResult = await processor.enhanceContent(faqRequest);
    console.log('✅ FAQ Generated:');
    console.log(faqResult.content);
    console.log('   Quality Score:', faqResult.qualityScore);
    
    // Test 4: Provider-Friendly Explanation
    console.log('\n🩺 Testing Provider-Friendly Explanation...');
    const explanationRequest = {
      drugData: testDrugData,
      contentType: 'provider-explanation',
      targetAudience: 'healthcare_provider',
      options: { maxLength: 300, tone: 'professional' }
    };
    
    const explanationResult = await processor.enhanceContent(explanationRequest);
    console.log('✅ Provider Explanation Generated:', explanationResult.content);
    console.log('   Length:', explanationResult.content.length, 'characters');
    console.log('   Quality Score:', explanationResult.qualityScore);
    
    // Test 5: Related Drugs Suggestions
    console.log('\n🔗 Testing Related Drugs Suggestions...');
    const relatedRequest = {
      drugData: testDrugData,
      contentType: 'related-drugs',
      targetAudience: 'general',
      options: { maxSuggestions: 3 }
    };
    
    const relatedResult = await processor.enhanceContent(relatedRequest);
    console.log('✅ Related Drugs Generated:', relatedResult.content);
    console.log('   Quality Score:', relatedResult.qualityScore);
    
    console.log('\n🎉 All AI Features Tested Successfully!');
    console.log('\n📊 Summary:');
    console.log(`   SEO Title: ${titleResult.content.length} chars, Score: ${titleResult.qualityScore}`);
    console.log(`   Meta Description: ${descriptionResult.content.length} chars, Score: ${descriptionResult.qualityScore}`);
    console.log(`   FAQ: Score: ${faqResult.qualityScore}`);
    console.log(`   Provider Explanation: ${explanationResult.content.length} chars, Score: ${explanationResult.qualityScore}`);
    console.log(`   Related Drugs: Score: ${relatedResult.qualityScore}`);
    
  } catch (error) {
    console.error('❌ AI Feature Test Failed:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 To test with real OpenAI API:');
      console.log('   1. Set OPENAI_API_KEY environment variable');
      console.log('   2. Ensure you have OpenAI API credits');
      console.log('   3. Check your API key permissions');
    }
  }
}

// Prompt the user for API key if not set
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'test-key') {
  console.log('⚠️  No valid OpenAI API key detected.');
  console.log('   Please set OPENAI_API_KEY environment variable to test AI features.');
  console.log('   Example: export OPENAI_API_KEY="sk-proj-your-key-here"');
  console.log('\n🔑 You can get an API key from: https://platform.openai.com/api-keys');
  console.log('\n💰 Note: This will make real API calls and consume credits.');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\nDo you want to proceed with testing? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      rl.question('Enter your OpenAI API key: ', (apiKey) => {
        if (apiKey && apiKey.startsWith('sk-')) {
          process.env.OPENAI_API_KEY = apiKey;
          console.log('\n✅ API key set. Starting tests...\n');
          testAIFeatures().finally(() => rl.close());
        } else {
          console.log('❌ Invalid API key format. Exiting.');
          rl.close();
        }
      });
    } else {
      console.log('❌ Testing cancelled.');
      rl.close();
    }
  });
} else {
  testAIFeatures();
}