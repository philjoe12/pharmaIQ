import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';

// Import existing processors and providers
import { ContentEnhancementProcessor } from './processors/content-enhancement.processor';
import { SeoGenerationProcessor } from './processors/seo-generation.processor';
import { FaqCreationProcessor } from './processors/faq-creation.processor';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { MedicalAccuracyValidator } from './validators/medical-accuracy.validator';
import { ContentQualityValidator } from './validators/content-quality.validator';
import { RetryStrategy } from './retry/retry-strategy';
import { PromptBuilderService } from './prompts/prompt-builder.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue({
      name: 'ai-enhancement',
    }),
  ],
  controllers: [],
  providers: [
    // AI Processors
    ContentEnhancementProcessor,
    SeoGenerationProcessor,
    FaqCreationProcessor,
    
    // AI Providers
    OpenAIProvider,
    AnthropicProvider,
    
    // Validators
    MedicalAccuracyValidator,
    ContentQualityValidator,
    
    // New Services
    RetryStrategy,
    PromptBuilderService,
  ],
})
export class AppModule {}