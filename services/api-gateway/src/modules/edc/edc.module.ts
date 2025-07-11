import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EdcController } from './controllers/edc.controller';
import { OpenClinicaService } from './services/openclinica.service';
import { EdcStudyEntity } from '../database/entities/edc-study.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([EdcStudyEntity])],
  controllers: [EdcController],
  providers: [OpenClinicaService],
  exports: [OpenClinicaService],
})
export class EdcModule {}
