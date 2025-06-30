import { Injectable } from '@nestjs/common';
import { BasePublisher } from './base-publisher';

@Injectable()
export class SeoEventsPublisher extends BasePublisher {
  async publishSEOGenerated(drugId: string, seoData: any): Promise<void> {
    const payload = this.createEventPayload({
      drugId,
      seoData
    });
    
    await this.publish('seo.generated', payload);
  }

  async publishSEOUpdated(drugId: string, seoData: any): Promise<void> {
    const payload = this.createEventPayload({
      drugId,
      seoData
    });
    
    await this.publish('seo.updated', payload);
  }

  async publishSitemapUpdated(): Promise<void> {
    const payload = this.createEventPayload({});
    
    await this.publish('sitemap.updated', payload);
  }

  async publishSchemaGenerated(drugId: string, schema: any): Promise<void> {
    const payload = this.createEventPayload({
      drugId,
      schema
    });
    
    await this.publish('schema.generated', payload);
  }
}