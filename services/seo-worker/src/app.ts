import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('SEO-Worker');
  
  try {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS for API access
    app.enableCors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    });
    
    const port = process.env.PORT || 3003;
    await app.listen(port);
    
    logger.log(`🔍 SEO Worker service running on port ${port}`);
    logger.log(`📋 Health check: http://localhost:${port}/health`);
    
  } catch (error) {
    logger.error('Failed to start SEO Worker service:', error);
    process.exit(1);
  }
}

bootstrap();