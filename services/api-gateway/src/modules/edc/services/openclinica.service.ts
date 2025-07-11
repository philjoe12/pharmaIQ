import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { EdcStudyEntity } from '../../../database/entities/edc-study.entity';

export interface OpenClinicaStudy {
  studyOID: string;
  name: string;
  status?: string;
}

export interface OpenClinicaQuery {
  queryId: string;
  text: string;
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

  async getOpenQueries(craId: string): Promise<OpenClinicaQuery[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/cras/${craId}/queries`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json',
        },
      });
      const data = response.data?.queries || response.data || [];
      return data as OpenClinicaQuery[];
    } catch (error: any) {
      this.logger.warn(`Failed to fetch queries for ${craId} from OpenClinica: ${error.message}`);
      try {
        const filePath = path.join(__dirname, '../data/sample-queries.json');
        const raw = fs.readFileSync(filePath, 'utf-8');
        const map = JSON.parse(raw) as Record<string, OpenClinicaQuery[]>;
        return map[craId] || [];
      } catch (fsError: any) {
        this.logger.error('Failed to load fallback OpenClinica queries', fsError);
        return [];
      }
    }
  }
}
