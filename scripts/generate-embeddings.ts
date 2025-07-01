import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../services/api-gateway/src/modules/app.module';
import { DrugService } from '../services/api-gateway/src/modules/drugs/services/drug.service';
import { EmbeddingService } from '../services/api-gateway/src/modules/ai/services/embedding.service';
import { DrugEntity } from '../services/api-gateway/src/database/entities/drug.entity';

const logger = new Logger('GenerateEmbeddings');

async function generateEmbeddingsForExistingDrugs() {
  logger.log('Starting embedding generation for existing drugs...');

  try {
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['log', 'error', 'warn'],
    });

    // Get required services
    const drugService = app.get(DrugService);
    const embeddingService = app.get(EmbeddingService);

    // Get embedding statistics before starting
    const initialStats = await embeddingService.getEmbeddingStats();
    logger.log(`Initial embedding stats: ${JSON.stringify(initialStats)}`);

    // Get all published drugs from the database
    const drugsResult = await drugService.findAll({ 
      page: 1, 
      limit: 1000, // Adjust as needed
      status: 'published' as any 
    });

    const drugs = drugsResult.data || [];
    logger.log(`Found ${drugs.length} published drugs to process`);

    if (drugs.length === 0) {
      logger.warn('No published drugs found in the database');
      await app.close();
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Process drugs in batches to avoid overwhelming the OpenAI API
    const batchSize = 3; // Small batch size to respect rate limits
    const delayBetweenBatches = 2000; // 2 seconds delay between batches

    for (let i = 0; i < drugs.length; i += batchSize) {
      const batch = drugs.slice(i, i + batchSize);
      logger.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(drugs.length / batchSize)} (${batch.length} drugs)`);

      // Process drugs in parallel within each batch
      const batchPromises = batch.map(async (drug) => {
        try {
          logger.log(`Generating embeddings for: ${drug.drugName}`);
          
          // Convert drug data to format expected by embedding service
          const drugEntity: DrugEntity = {
            id: drug.setId,
            setId: drug.setId,
            drugName: drug.drugName,
            genericName: drug.genericName || null,
            slug: drug.slug || '',
            manufacturer: drug.labeler,
            status: 'published' as any,
            labelData: drug.label,
            processedData: null,
            aiContent: [],
            seoMetadata: undefined as any,
            processingLogs: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const embeddings = await embeddingService.generateDrugEmbeddings(drugEntity);
          logger.log(`✅ Generated ${embeddings.length} embeddings for ${drug.drugName}`);
          return { success: true, drugName: drug.drugName, embeddingCount: embeddings.length };
        } catch (error: any) {
          logger.error(`❌ Failed to generate embeddings for ${drug.drugName}:`, error.message);
          return { success: false, drugName: drug.drugName, error: error.message };
        }
      });

      // Wait for all drugs in the batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Count successes and errors
      batchResults.forEach(result => {
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      });

      // Log batch progress
      logger.log(`Batch completed. Current stats: ${successCount} success, ${errorCount} errors`);

      // Delay between batches (except for the last batch)
      if (i + batchSize < drugs.length) {
        logger.log(`Waiting ${delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    // Get final embedding statistics
    const finalStats = await embeddingService.getEmbeddingStats();
    logger.log(`Final embedding stats: ${JSON.stringify(finalStats)}`);

    // Summary
    logger.log('🎉 Embedding generation completed!');
    logger.log(`📊 Summary:`);
    logger.log(`  - Total drugs processed: ${drugs.length}`);
    logger.log(`  - Successful: ${successCount}`);
    logger.log(`  - Failed: ${errorCount}`);
    logger.log(`  - Total embeddings generated: ${finalStats.total}`);
    logger.log(`  - By content type: ${JSON.stringify(finalStats.byContentType, null, 2)}`);

    await app.close();
  } catch (error) {
    logger.error('Fatal error in embedding generation:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the script
generateEmbeddingsForExistingDrugs();