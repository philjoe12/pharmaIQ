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

  private async request<T>(endpoint: string): Promise<T> {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      this.logger.error(`OpenClinica request failed: GET ${endpoint}`, error);
      throw new Error('OpenClinica API request failed');
    }
  }

  async getStudies(): Promise<OpenClinicaStudy[]> {
    const data = await this.request<any>('/studies');
    return data.studies || data;
  }

  async getStudyEvents(studyId: string): Promise<any> {
    return this.request(`/studies/${studyId}/events`);
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
