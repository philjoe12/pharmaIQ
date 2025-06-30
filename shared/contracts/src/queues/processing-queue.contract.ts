// Queue contracts for label processing

export interface LabelProcessingJob {
  id: string;
  type: 'label-import' | 'batch-import';
  data: {
    labelData?: any; // FDA Label data
    labels?: any[]; // For batch import
    source: string;
    importId: string;
    priority: 'high' | 'normal' | 'low';
  };
  options?: {
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
    removeOnComplete?: boolean;
    removeOnFail?: boolean;
  };
}

export interface ProcessingResult {
  success: boolean;
  drugId?: string;
  slug?: string;
  processingTime: number;
  warnings?: string[];
  error?: string;
}