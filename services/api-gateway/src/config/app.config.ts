import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  environment: process.env.NODE_ENV || 'development',
  name: 'PharmaIQ API Gateway',
  version: '1.0.0',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  apiPrefix: 'api',
  swaggerPath: 'api/docs',
}));