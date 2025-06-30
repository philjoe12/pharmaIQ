import { registerAs } from '@nestjs/config';

export default registerAs('eventBus', () => ({
  maxListeners: parseInt(process.env.EVENT_MAX_LISTENERS, 10) || 10,
  wildcard: true,
  delimiter: '.',
  verboseMemoryLeak: process.env.NODE_ENV === 'development',
  ignoreErrors: process.env.NODE_ENV === 'production',
}));