import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DrugService } from '../services/drug.service';
import { DrugCacheService } from '../services/drug-cache.service';
import { DrugQueryDto } from '../dto/drug-query.dto';
import { DrugDto } from '../dto/drug.dto';
import { DrugStatus, PaginatedResponse, ApiResponse as ApiResponseType } from '../../../shared-types';

@ApiTags('Drug Administration')
@Controller('admin/drugs')
// @UseGuards(JwtAuthGuard, RolesGuard) // Uncomment when auth is implemented
// @ApiBearerAuth()
export class DrugAdminController {
  constructor(
    private readonly drugService: DrugService,
    private readonly drugCacheService: DrugCacheService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get drug statistics' })
  @ApiResponse({ status: 200, description: 'Drug statistics retrieved successfully' })
  async getStats(): Promise<ApiResponseType<Record<string, number>>> {
    const stats = await this.drugService.getStats();
    return {
      success: true,
      data: stats
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all drugs (admin view)' })
  @ApiResponse({ status: 200, description: 'Drugs retrieved successfully', type: [DrugDto] })
  async findAll(@Query() query: DrugQueryDto): Promise<PaginatedResponse<DrugDto>> {
    const result = await this.drugService.findAll(query);
    return {
      ...result,
      data: result.data.map((drug: any) => ({
        id: drug.setId,
        brandName: drug.drugName,
        genericName: drug.label.genericName || '',
        manufacturer: drug.labeler,
        slug: drug.slug,
        status: DrugStatus.PUBLISHED,
        therapeuticCategories: [],
        conditions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get drug by ID (admin view)' })
  @ApiResponse({ status: 200, description: 'Drug retrieved successfully', type: DrugDto })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  async findById(@Param('id') id: string): Promise<ApiResponseType<DrugDto>> {
    const drug = await this.drugService.findById(id);
    return {
      success: true,
      data: {
        id: drug.setId,
        brandName: drug.drugName,
        genericName: drug.label.genericName || '',
        manufacturer: drug.labeler,
        slug: drug.slug,
        status: DrugStatus.PUBLISHED,
        therapeuticCategories: [],
        conditions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update drug status' })
  @ApiResponse({ status: 200, description: 'Drug status updated successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: DrugStatus
  ): Promise<ApiResponseType<DrugDto>> {
    const drug = await this.drugService.updateStatus(id, status);
    
    // Invalidate cache
    await this.drugCacheService.invalidate(drug);
    
    return {
      success: true,
      data: drug,
      message: `Drug status updated to ${status}`
    };
  }

  @Post('cache/invalidate')
  @ApiOperation({ summary: 'Invalidate drug cache' })
  @ApiResponse({ status: 200, description: 'Cache invalidated successfully' })
  async invalidateCache(): Promise<ApiResponseType> {
    await this.drugCacheService.invalidateAll();
    return {
      success: true,
      message: 'Drug cache invalidated successfully'
    };
  }

  @Post(':id/reprocess')
  @ApiOperation({ summary: 'Trigger drug reprocessing' })
  @ApiResponse({ status: 200, description: 'Drug reprocessing triggered' })
  async reprocessDrug(@Param('id') id: string): Promise<ApiResponseType> {
    const drug = await this.drugService.updateStatus(id, DrugStatus.PROCESSING);
    
    // Trigger AI enhancement
    await this.drugService.enhanceDrugContent(id);
    
    return {
      success: true,
      message: `Drug ${drug.drugName} marked for reprocessing`
    };
  }

  @Post('import')
  @ApiOperation({ summary: 'Import drugs from Labels.json file' })
  @ApiResponse({ status: 200, description: 'Import process started' })
  async importDrugs(): Promise<ApiResponseType> {
    try {
      await this.drugService.importLabelsFromFile();
      return {
        success: true,
        message: 'Drug import completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Import failed: ${error.message}`
      };
    }
  }

  @Post(':id/enhance')
  @ApiOperation({ summary: 'Trigger AI content enhancement for a drug' })
  @ApiResponse({ status: 200, description: 'AI enhancement triggered' })
  async enhanceDrug(@Param('id') id: string): Promise<ApiResponseType> {
    try {
      await this.drugService.enhanceDrugContent(id);
      return {
        success: true,
        message: 'AI enhancement jobs queued successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Enhancement failed: ${error.message}`
      };
    }
  }
}