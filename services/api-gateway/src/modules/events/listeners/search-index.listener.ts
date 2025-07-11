import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ElasticsearchService } from '../../search/services/elasticsearch.service';
import { DrugRepository } from '../../database/repositories/drug.repository';

@Injectable()
export class SearchIndexListener {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly drugRepository: DrugRepository,
  ) {}

  private async indexDrug(drugId: string): Promise<void> {
    const drug = await this.drugRepository.findBySetId(drugId);
    if (drug) {
      try {
        await this.elasticsearchService.indexDrug(drug);
        console.log(`Indexed drug ${drugId} in Elasticsearch`);
      } catch (error) {
        console.error(`Failed to index drug ${drugId}:`, error);
      }
    }
  }
  @OnEvent('drug.imported')
  async handleDrugImported(payload: { drugId: string; labelData: any }) {
    console.log(`Updating search index for new drug: ${payload.drugId}`);
    await this.indexDrug(payload.drugId);
  }

  @OnEvent('drug.updated')
  async handleDrugUpdated(payload: { drugId: string }) {
    console.log(`Updating search index for drug: ${payload.drugId}`);
    await this.indexDrug(payload.drugId);
  }

  @OnEvent('content.enhanced')
  async handleContentEnhanced(payload: { drugId: string }) {
    console.log(`Updating search index for enhanced content: ${payload.drugId}`);
    await this.indexDrug(payload.drugId);
  }
}