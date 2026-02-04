/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as path from 'path';
import helmet from 'helmet';
import { urlencoded } from 'express';
import { NestExpressApplication } from '@nestjs/platform-express';

// Imports for Swagger
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Enable raw body for webhook signature verification
    rawBody: true,
  });

  // Security: Helmet - Set various HTTP headers for security
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    }),
  );

  // CORS: Production must set ALLOWED_ORIGINS to explicit front-end origins (e.g. https://app.example.com).
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
  });

  // Request size limits (10mb for JSON and URL-encoded bodies)
  app.use(json({ limit: '10mb', verify: (req: any, res, buf) => { req.rawBody = buf; } }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Global Pipes for validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.use(cookieParser());

  // Invisible Foreman: serve generated receipt images at /receipts
  app.use('/receipts', (require('express') as typeof import('express')).static(path.join(process.cwd(), 'uploads', 'receipts')));

  // Swagger config n 
  const config = new DocumentBuilder()
    .setTitle('Mechu/R Xanic Booking API')
    .setDescription('API for mechanic service and booking system')
    .setVersion('1.0')
    .addBearerAuth() // if using JWT Auth
    .build();

  // OpenAPI/Swagger: UI at /api, JSON spec at /api-json (use for contract-first / client generation)
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Listen on environment port or default to 3000
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
