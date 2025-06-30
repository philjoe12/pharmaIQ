// @deprecated - Use drug.types.ts instead
// This file is kept for backward compatibility only

export type {
  FDALabel,
  LabelContent,
  ProcessedDrugData,
  DrugInfo,
  ManufacturerInfo,
  ProcessingMetadata,
  ValidationResult
} from './drug.types';

// Legacy exports for parsing
export interface ParsedSection {
  title: string;
  content: string;
  subsections?: ParsedSection[];
  tables?: TableData[];
  lists?: string[][];
}

export interface TableData {
  headers: string[];
  rows: string[][];
  caption?: string;
}

export interface SectionCode {
  code: string;
  displayName: string;
}