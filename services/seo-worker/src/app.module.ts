import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { StructuredDataProcessor } from './processors/structured-data.processor';
import { SitemapProcessor } from './processors/sitemap.processor';
import { MetaTagsGenerator } from './generators/meta-tags.generator';

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
      name: 'seo-optimization',
    }),
  ],
  controllers: [],
  providers: [
    StructuredDataProcessor,
    SitemapProcessor,
    MetaTagsGenerator,
  ],
})
export class AppModule {}