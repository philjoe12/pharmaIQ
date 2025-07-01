import { IsArray, IsString, IsOptional, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class CompareDrugsDto {
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @IsString({ each: true })
  drugIds: string[];

  @IsOptional()
  @IsString()
  userType?: 'healthcare_provider' | 'pharmacist' | 'patient' | 'general';

  @IsOptional()
  @IsString()
  scenario?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}

export interface DrugComparisonResult {
  drugs: any[];
  aiAnalysis: {
    overallRecommendation: string;
    keyDifferences: string[];
    effectivenessComparison: {
      drug: string;
      score: number;
      reasoning: string;
    }[];
    safetyProfile: {
      drug: string;
      riskLevel: 'low' | 'medium' | 'high';
      keyRisks: string[];
    }[];
    costEffectiveness: {
      drug: string;
      costTier: 'low' | 'medium' | 'high';
      valueRating: number;
    }[];
    patientPreferences: {
      bestFor: string;
      drugs: string[];
      reasoning: string;
    }[];
  };
  comparisonMatrix: {
    category: string;
    metrics: {
      metric: string;
      values: { drug: string; value: string; score?: number }[];
    }[];
  }[];
}