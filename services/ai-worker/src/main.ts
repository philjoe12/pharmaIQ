import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('AIWorker');
  
  try {
    const app = await NestFactory.create(AppModule);
    
    // Global prefix for all routes
    app.setGlobalPrefix('api/v1');
    
    // Enable CORS for cross-origin requests
    app.enableCors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
    });

    const port = process.env.PORT || 3002;
    await app.listen(port);
    
    logger.log(`AI Worker running on port ${port}`);
  } catch (error) {
    logger.error('Failed to start AI Worker', error);
    process.exit(1);
  }
}

bootstrap();