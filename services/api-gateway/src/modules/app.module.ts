import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Config
import appConfig from '../config/app.config';
import databaseConfig from '../config/database.config';
import redisConfig from '../config/redis.config';
import edcConfig from '../config/edc.config';

// Modules
import { DrugsModule } from './drugs/drug.module';
import { HealthModule } from './health/health.module';
import { AIModule } from './ai/ai.module';
import { MCPServerModule } from './mcp-server/mcp.module';
import { ProcessingModule } from './processing/processing.module';
import { SeoOptimizationModule } from './seo-optimization/seo-optimization.module';
import { WorkflowModule } from './workflow/workflow.module';
import { EventsModule } from './events/events.module';
import { EdcModule } from './edc/edc.module';
import { CraModule } from './cra/cra.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, edcConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Event system
    EventEmitterModule.forRoot({
      global: true,
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('database'),
      inject: [ConfigService],
    }),

    // Redis Cache
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default TTL
    }),

    // Bull Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redis = configService.get('redis');
        return {
          redis: {
            host: redis.host,
            port: redis.port,
          },
        };
      },
      inject: [ConfigService],
    }),

    // Feature Modules
    DrugsModule,
    AIModule,
    ProcessingModule,
    SeoOptimizationModule,
    WorkflowModule,
    MCPServerModule,
    EventsModule,
    HealthModule,
    EdcModule,
    CraModule,
  ],
})
export class AppModule {}