import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { EdcStudyEntity } from '../../../database/entities/edc-study.entity';

export interface OpenClinicaStudy {
  studyOID: string;
  name: string;
  status?: string;
}

@Injectable()
export class OpenClinicaService {
  private readonly logger = new Logger(OpenClinicaService.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(EdcStudyEntity)
    private readonly studyRepository: Repository<EdcStudyEntity>,
  ) {
    this.baseUrl = this.configService.get<string>('edc.openClinicaUrl');
    this.token = this.configService.get<string>('edc.openClinicaToken');
  }

  async getStudies(): Promise<OpenClinicaStudy[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/studies`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json',
        },
      });
      const data = response.data?.studies || response.data || [];
      return data as OpenClinicaStudy[];
    } catch (error) {
      this.logger.error('Failed to fetch studies from OpenClinica', error);
      throw new Error('OpenClinica API request failed');
    }
  }

  async syncStudies(): Promise<EdcStudyEntity[]> {
    const studies = await this.getStudies();
    const saved: EdcStudyEntity[] = [];
    for (const study of studies) {
      const existing = await this.studyRepository.findOne({
        where: { ocStudyId: study.studyOID },
      });
      if (existing) {
        existing.name = study.name;
        existing.status = study.status;
        saved.push(await this.studyRepository.save(existing));
      } else {
        const entity = this.studyRepository.create({
          ocStudyId: study.studyOID,
          name: study.name,
          status: study.status,
        });
        saved.push(await this.studyRepository.save(entity));
      }
    }
    return saved;
  }
}
