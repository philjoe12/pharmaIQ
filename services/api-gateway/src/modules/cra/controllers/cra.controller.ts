import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CraService } from '../services/cra.service';

@ApiTags('CRA Workload')
@Controller('cra')
export class CraController {
  constructor(private readonly craService: CraService) {}

  @Get('workloads')
  getWorkloads() {
    return this.craService.getAll();
  }

  @Get('workloads/:id')
  getWorkload(@Param('id') id: string) {
    const data = this.craService.getById(id);
    if (!data) {
      throw new NotFoundException('CRA not found');
    }
    return data;
  }

  @Get('workloads/:id/suggestions')
  async getSuggestions(@Param('id') id: string) {
    return this.craService.suggestQueryResponses(id);
  }
}
