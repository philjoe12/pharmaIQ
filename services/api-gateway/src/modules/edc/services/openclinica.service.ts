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

  async getStudies(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/studies`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch studies from OpenClinica', error);
      throw new Error('OpenClinica API request failed');
    }
  }
}
