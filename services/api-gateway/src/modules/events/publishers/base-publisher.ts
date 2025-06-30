import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BasePublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  protected async publish(eventName: string, payload: any): Promise<void> {
    try {
      this.eventEmitter.emit(eventName, payload);
      console.log(`Event published: ${eventName}`, payload);
    } catch (error) {
      console.error(`Failed to publish event ${eventName}:`, error);
      throw error;
    }
  }

  protected createEventPayload(data: any): any {
    return {
      ...data,
      timestamp: new Date(),
      version: '1.0',
      id: this.generateEventId()
    };
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}