import Bull from 'bull';
import express from 'express';
import axios from 'axios';

console.log('⚙️ Processing Worker starting...');

// Initialize Redis connection
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// API Gateway connection
const apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://localhost:3001';

// Create Bull queues
const labelProcessingQueue = new Bull('label-processing', { redis: redisConfig });
const drugImportQueue = new Bull('drug-import', { redis: redisConfig });

// Express app for health checks
const app = express();

app.get('/health', async (req, res) => {
  try {
    const waiting = await labelProcessingQueue.waiting();
    const active = await labelProcessingQueue.active();
    const completed = await labelProcessingQueue.completed();
    const failed = await labelProcessingQueue.failed();

    res.json({ 
      status: 'healthy', 
      service: 'processing-worker',
      timestamp: new Date().toISOString(),
      queues: {
        'label-processing': {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length
        }
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'processing-worker',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Label processing job processor using real ProcessingService
labelProcessingQueue.process('process-fda-label', async (job) => {
  const { labelData, setId } = job.data;
  
  console.log(`Processing FDA label for drug: ${labelData.drug_name || 'Unknown'} (${setId})`);
  
  try {
    // Call the API Gateway's ProcessingService
    const response = await axios.post(`${apiGatewayUrl}/processing/process-label`, {
      labelData,
      setId
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'processing-worker'
      }
    });

    const processed = response.data;
    console.log(`✅ Successfully processed FDA label for: ${processed.drugName}`);
    
    // Trigger drug import after successful processing
    await drugImportQueue.add('import-processed-drug', {
      processedData: processed,
      originalLabel: labelData,
      setId
    }, {
      attempts: 3,
      backoff: 'exponential'
    });

    return processed;
  } catch (error) {
    console.error(`❌ Failed to process FDA label for ${setId}:`, error.message);
    
    // Fallback processing if API is unavailable
    const fallbackProcessed = await fallbackProcessing(labelData);
    console.log(`⚠️ Used fallback processing for: ${fallbackProcessed.drugName}`);
    
    return fallbackProcessed;
  }
});

// Drug import job processor
drugImportQueue.process('import-processed-drug', async (job) => {
  const { processedData, originalLabel, setId } = job.data;
  
  console.log(`Importing processed drug: ${processedData.drugName} (${setId})`);
  
  try {
    // Import the processed drug into the database
    const response = await axios.post(`${apiGatewayUrl}/drugs/import`, {
      setId,
      drugName: processedData.drugName,
      manufacturer: processedData.manufacturer,
      labelData: originalLabel,
      processedData
    }, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'processing-worker'
      }
    });

    console.log(`✅ Successfully imported drug: ${processedData.drugName}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to import drug ${setId}:`, error.message);
    throw error;
  }
});

// Fallback processing function
async function fallbackProcessing(labelData: any) {
  // Basic extraction when API is not available
  return {
    drugName: labelData.drug_name || labelData.openfda?.brand_name?.[0] || 'Unknown Drug',
    manufacturer: labelData.manufacturer || labelData.openfda?.manufacturer_name?.[0] || 'Unknown',
    indications: extractTextArray(labelData.indications_and_usage || labelData.indications),
    contraindications: extractTextArray(labelData.contraindications),
    dosage: {
      administration: labelData.dosage_and_administration,
      formsAndStrengths: labelData.dosage_forms_and_strengths
    },
    warnings: extractTextArray(labelData.warnings || labelData.warnings_and_precautions),
    processed: true,
    fallback: true,
    timestamp: new Date().toISOString()
  };
}

function extractTextArray(text: any): string[] {
  if (!text) return [];
  if (Array.isArray(text)) return text.slice(0, 10);
  
  return text
    .split(/[•\n\r]/)
    .map((item: string) => item.trim())
    .filter((item: string) => item.length > 10)
    .slice(0, 10);
}

// Error handling
labelProcessingQueue.on('failed', (job, err) => {
  console.error(`Label processing job ${job.id} failed:`, err);
});

labelProcessingQueue.on('completed', (job, result) => {
  console.log(`Label processing job ${job.id} completed for: ${result.drugName}`);
});

const port = process.env.PORT || 3004;
app.listen(port, () => {
  console.log(`⚙️ Processing Worker running on port ${port}`);
});

process.on('SIGTERM', () => {
  console.log('🛑 Processing Worker shutting down...');
  labelProcessingQueue.close();
  process.exit(0);
});