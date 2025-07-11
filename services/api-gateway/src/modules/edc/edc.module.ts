import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EdcController } from './controllers/edc.controller';
import { OpenClinicaService } from './services/openclinica.service';

@Module({
  imports: [ConfigModule],
  controllers: [EdcController],
  providers: [OpenClinicaService],
  exports: [OpenClinicaService],
})
export class EdcModule {}
