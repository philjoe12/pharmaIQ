import { registerAs } from '@nestjs/config';

export default registerAs('queue', () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
  queues: {
    labelProcessing: {
      name: 'label-processing',
      concurrency: parseInt(process.env.MAX_CONCURRENT_LABEL_PROCESSING, 10) || 5,
    },
    aiProcessing: {
      name: 'ai-processing',
      concurrency: parseInt(process.env.AI_CONCURRENT_REQUESTS, 10) || 5,
    },
    seoProcessing: {
      name: 'seo-processing',
      concurrency: 3,
    },
  },
}));