import { Controller, Get } from '@nestjs/common';
import { OpenClinicaService } from '../services/openclinica.service';

@Controller('edc')
export class EdcController {
  constructor(private readonly openClinicaService: OpenClinicaService) {}

  @Get('studies')
  async getStudies() {
    return this.openClinicaService.getStudies();
  }
}
