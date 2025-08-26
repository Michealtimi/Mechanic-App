/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser'; // Corrected spelling for consistency

// Imports for Swagger
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Pipes for validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Cookie Parser middleware
  app.use(cookieParser()); // No change here, just noting its presence

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('Mechanic Booking API')
    .setDescription('API for mechanic service and booking system')
    .setVersion('1.0')
    .addBearerAuth() // if using JWT Auth
    .build();

  /// this method take two instance the app and the swagger config
  const document = SwaggerModule.createDocument(app, config); /// this is used to generate the swagger document when requested.
  SwaggerModule.setup('api', app, document); // Visit http://localhost:3000/api

  // Listen on environment port or default to 3000
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
