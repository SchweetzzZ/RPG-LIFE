import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv'
import { ZodValidationPipe } from 'nestjs-zod';

dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ZodValidationPipe())
  app.use(cookieParser())

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
