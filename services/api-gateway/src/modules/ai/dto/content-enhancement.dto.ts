import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional } from 'class-validator';

export class FAQDto {
  @ApiProperty({ description: 'FAQ question' })
  @IsString()
  question: string;

  @ApiProperty({ description: 'FAQ answer' })
  @IsString()
  answer: string;
}

export class EnhancedContentDto {
  @ApiProperty({ description: 'SEO-optimized title under 60 characters' })
  @IsString()
  seoTitle: string;

  @ApiProperty({ description: 'Meta description under 160 characters' })
  @IsString()
  metaDescription: string;

  @ApiProperty({ description: 'Provider-friendly explanation' })
  @IsString()
  providerExplanation: string;

  @ApiProperty({ description: 'Frequently asked questions', type: [FAQDto] })
  @IsArray()
  faqs: FAQDto[];

  @ApiProperty({ description: 'Related medical conditions' })
  @IsArray()
  @IsString({ each: true })
  relatedConditions: string[];

  @ApiProperty({ description: 'Related drugs or drug classes' })
  @IsArray()
  @IsString({ each: true })
  relatedDrugs: string[];

  @ApiProperty({ description: 'Key therapeutic benefits' })
  @IsArray()
  @IsString({ each: true })
  keyBenefits: string[];

  @ApiProperty({ description: 'Patient-friendly drug name', required: false })
  @IsOptional()
  @IsString()
  patientFriendlyName?: string;
}

export class ContentEnhancementRequestDto {
  @ApiProperty({ description: 'Drug slug to enhance' })
  @IsString()
  slug: string;

  @ApiProperty({ 
    description: 'Content types to generate',
    enum: ['seo', 'explanation', 'faqs', 'related', 'all'],
    default: 'all'
  })
  @IsOptional()
  @IsString()
  type?: 'seo' | 'explanation' | 'faqs' | 'related' | 'all' = 'all';
}