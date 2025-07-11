import { Controller, Get, Param } from '@nestjs/common';
import { OpenClinicaService } from '../services/openclinica.service';

@Controller('edc')
export class EdcController {
  constructor(private readonly openClinicaService: OpenClinicaService) {}

  @Get('studies')
  async getStudies() {
    return this.openClinicaService.getStudies();
  }

  @Get('studies/:studyId/events')
  async getStudyEvents(@Param('studyId') studyId: string) {
    return this.openClinicaService.getStudyEvents(studyId);
  }
}
