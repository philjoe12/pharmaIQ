import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LabelImportProcessor } from './processors/label-import.processor';
import { DataValidatorProcessor } from './processors/data-validator.processor';
import { FdaLabelParser } from './parsers/fda-label.parser';

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
      name: 'label-processing',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LabelImportProcessor,
    DataValidatorProcessor,
    FdaLabelParser,
  ],
})
export class AppModule {}