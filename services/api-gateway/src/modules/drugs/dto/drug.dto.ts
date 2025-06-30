import { IsString, IsOptional, IsEnum, IsArray, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DrugStatus } from '@pharmaiq/types';

export class DrugDto {
  @ApiProperty({ description: 'Drug ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Drug slug' })
  @IsString()
  slug: string;

  @ApiProperty({ description: 'Brand name' })
  @IsString()
  brandName: string;

  @ApiProperty({ description: 'Generic name' })
  @IsString()
  genericName: string;

  @ApiProperty({ description: 'Manufacturer' })
  @IsString()
  manufacturer: string;

  @ApiPropertyOptional({ description: 'NDC codes', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ndcCodes?: string[];

  @ApiProperty({ description: 'Drug status', enum: DrugStatus })
  @IsEnum(DrugStatus)
  status: DrugStatus;

  @ApiPropertyOptional({ description: 'Therapeutic categories', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  therapeuticCategories?: string[];

  @ApiPropertyOptional({ description: 'Related drugs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relatedDrugs?: string[];

  @ApiPropertyOptional({ description: 'Conditions', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conditions?: string[];

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}