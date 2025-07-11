import { Injectable, Logger, Optional } from '@nestjs/common';
import { AIService } from '../../ai/services/ai.service';
import { OpenClinicaService, OpenClinicaQuery } from '../../edc/services/openclinica.service';
import * as path from 'path';
import * as fs from 'fs';

export interface CRAWorkloadRaw {
  craId: string;
  name: string;
  openQueries: number;
  patientVisits: number;
  travelDays: number;
}

export interface CRAWorkload extends CRAWorkloadRaw {
  burnoutScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface SuggestedQueryResponse {
  queryId: string;
  suggestion: string;
}

@Injectable()
export class CraService {
  private readonly logger = new Logger(CraService.name);
  private readonly data: CRAWorkloadRaw[];

  constructor(
    @Optional() private readonly openClinica?: OpenClinicaService,
    @Optional() private readonly ai?: AIService,
  ) {
    const filePath = path.join(__dirname, '../data/sample-workload.json');
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      this.data = JSON.parse(raw) as CRAWorkloadRaw[];
    } catch (error) {
      this.logger.error(`Failed to load workload data: ${error.message}`);
      this.data = [];
    }
  }

  getAll(): CRAWorkload[] {
    return this.data.map(d => this.computeWorkload(d));
  }

  getById(id: string): CRAWorkload | undefined {
    const item = this.data.find(d => d.craId === id);
    return item ? this.computeWorkload(item) : undefined;
  }

  private computeWorkload(data: CRAWorkloadRaw): CRAWorkload {
    const base = data.openQueries / Math.max(data.patientVisits, 1);
    const score = parseFloat((base + data.travelDays * 0.1).toFixed(2));
    let risk: 'low' | 'medium' | 'high' = 'low';
    if (score > 10) risk = 'high';
    else if (score > 5) risk = 'medium';
    return { ...data, burnoutScore: score, riskLevel: risk };
  }

  async suggestQueryResponses(craId: string): Promise<SuggestedQueryResponse[]> {
    if (!this.openClinica || !this.ai) {
      this.logger.warn('OpenClinicaService or AIService not configured');
      return [];
    }

    const queries: OpenClinicaQuery[] = await this.openClinica.getOpenQueries(craId);
    const suggestions: SuggestedQueryResponse[] = [];
    for (const q of queries) {
      try {
        const prompt = `Provide a concise response to the clinical site question: "${q.text}"`;
        const answer = await this.ai.callOpenAI(prompt, 150);
        suggestions.push({ queryId: q.queryId, suggestion: answer });
      } catch (error: any) {
        this.logger.error(`AI generation failed for query ${q.queryId}`, error);
      }
    }
    return suggestions;
  }
}
