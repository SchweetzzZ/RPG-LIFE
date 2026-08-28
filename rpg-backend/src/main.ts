import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  app.use(cookieParser());
  app.useGlobalPipes(new ZodValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Life RPG API')
    .setDescription('Documentação da API de Caçadores')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Corrige o documento OpenAPI para funcionar corretamente com nestjs-zod
  const openApiDocument = cleanupOpenApiDoc(document);

  SwaggerModule.setup('api', app, openApiDocument, {
    jsonDocumentUrl: 'api/json',
  });

  const port = Number(process.env.PORT) || 4000;

  await app.listen(port);

  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📖 Swagger: http://localhost:${port}/api`);
  console.log(`📄 OpenAPI JSON: http://localhost:${port}/api/json`);
}

bootstrap();