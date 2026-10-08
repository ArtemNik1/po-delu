import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const corsOrigin = config.get<string>('CORS_ORIGIN', 'http://localhost:5173');
  const origins = corsOrigin
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  app.enableCors({
    // Always pass an array so only matching Origin values are reflected.
    origin: origins,
    credentials: true,
  });

  const swagger = new DocumentBuilder()
    .setTitle('По делу API')
    .setDescription('JWT-protected Task Manager API.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(
    'api/docs',
    app,
    SwaggerModule.createDocument(app, swagger),
  );

  const port = Number(config.get('PORT', 3000));
  await app.listen(port);
}

void bootstrap();
