import { Injectable } from '@nestjs/common';
import { BasePublisher } from './base-publisher';

@Injectable()
export class DrugEventsPublisher extends BasePublisher {
  async publishDrugImported(drugId: string, labelData: any): Promise<void> {
    const payload = this.createEventPayload({
      drugId,
      labelData
    });
    
    await this.publish('drug.imported', payload);
  }

  async publishDrugUpdated(drugId: string, changes: any): Promise<void> {
    const payload = this.createEventPayload({
      drugId,
      changes
    });
    
    await this.publish('drug.updated', payload);
  }

  async publishDrugDeleted(drugId: string): Promise<void> {
    const payload = this.createEventPayload({
      drugId
    });
    
    await this.publish('drug.deleted', payload);
  }

  async publishProcessingStarted(drugId: string): Promise<void> {
    const payload = this.createEventPayload({
      drugId
    });
    
    await this.publish('drug.processing.started', payload);
  }

  async publishProcessingCompleted(drugId: string, result: any): Promise<void> {
    const payload = this.createEventPayload({
      drugId,
      result
    });
    
    await this.publish('drug.processing.completed', payload);
  }
}