import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProcessingService } from './services/processing.service';
import { ProcessingController } from './controllers/processing.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ProcessingController],
  providers: [ProcessingService],
  exports: [ProcessingService],
})
export class ProcessingModule {}