import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SeoOptimizationService } from './services/seo-optimization.service';
import { SeoOptimizationController } from './controllers/seo-optimization.controller';

@Module({
  imports: [ConfigModule],
  controllers: [SeoOptimizationController],
  providers: [SeoOptimizationService],
  exports: [SeoOptimizationService],
})
export class SeoOptimizationModule {}