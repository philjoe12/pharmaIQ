import { BaseEvent } from '@pharmaiq/types';

export const DRUG_IMPORT_EVENTS = {
  STARTED: 'drug.import.started',
  COMPLETED: 'drug.import.completed',
  FAILED: 'drug.import.failed',
} as const;

export interface DrugImportStartedPayload {
  fileName: string;
  totalDrugs: number;
  jobId: string;
}

export interface DrugImportCompletedPayload {
  jobId: string;
  drugsProcessed: number;
  duration: number;
}

export interface DrugImportFailedPayload {
  jobId: string;
  error: string;
  failedDrugs: string[];
}