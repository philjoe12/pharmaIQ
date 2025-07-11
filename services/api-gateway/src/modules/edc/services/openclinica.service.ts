import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class OpenClinicaService {
  private readonly logger = new Logger(OpenClinicaService.name);
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(private configService: ConfigService) {
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

  async getStudies(): Promise<any> {
    return this.request('/studies');
  }

  async getStudyEvents(studyId: string): Promise<any> {
    return this.request(`/studies/${studyId}/events`);
  }
}
