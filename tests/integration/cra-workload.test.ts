import { CraService, SuggestedQueryResponse } from '../../services/api-gateway/src/modules/cra/services/cra.service';
import { OpenClinicaService, OpenClinicaQuery } from '../../services/api-gateway/src/modules/edc/services/openclinica.service';
import { AIService } from '../../services/api-gateway/src/modules/ai/services/ai.service';

class MockOpenClinicaService {
  async getOpenQueries(): Promise<OpenClinicaQuery[]> {
    return [{ queryId: 'Q1', text: 'Missing date' }];
  }
}

class MockAIService {
  async callOpenAI(): Promise<string> {
    return 'Use EHR to verify date';
  }
}

describe('CRA Workload Service', () => {
  const service = new CraService(new MockOpenClinicaService() as unknown as OpenClinicaService, new MockAIService() as unknown as AIService);

  it('calculates burnout score and risk level', () => {
    const cra = service.getById('CRA001');
    expect(cra).toBeDefined();
    if (!cra) return;
    expect(cra.burnoutScore).toBeGreaterThan(0);
    expect(['low', 'medium', 'high']).toContain(cra.riskLevel);
  });

  it('suggests responses for open queries', async () => {
    const suggestions = await service.suggestQueryResponses('CRA001');
    expect(suggestions.length).toBe(1);
    expect((suggestions[0] as SuggestedQueryResponse).suggestion).toContain('EHR');
  });
});
