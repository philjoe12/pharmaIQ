import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Security middleware - temporarily disabled
  // app.use(helmet());
  
  // Enable CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : false,
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  
  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('PharmaIQ API')
    .setDescription('AI-enhanced drug information platform API')
    .setVersion('1.0')
    .addTag('drugs')
    .addTag('search')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`=� API Gateway running on port ${port}`);
  console.log(`=� API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap().catch(err => {
  console.error('Failed to start API Gateway:', err);
  process.exit(1);
});