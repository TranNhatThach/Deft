import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security constraint: Limit body size to 1mb
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Enable CORS for mobile development
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Security constraint: Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Security constraint: Global Sanitizing Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Deft Backend running on port ${port}`);
}
bootstrap();
