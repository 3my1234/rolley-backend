import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UsdtListenerService } from './wallet/usdt-listener.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS BEFORE body parsing (important for preflight requests)
  const frontendEnv = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = Array.from(new Set([
    frontendEnv,
    'http://localhost:5173',
  ]));

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Default port 3003 to avoid conflict with friend's backend (3001)
  const port = process.env.PORT || 3003;
  await app.listen(port);
  
  console.log(`🚀 Backend running on http://localhost:${port}`);

  // Start USDT deposit listener
  try {
    const usdtListener = app.get(UsdtListenerService);
    await usdtListener.startListening();
  } catch (error) {
    console.warn('⚠️  Could not start USDT listener:', error);
  }
}

bootstrap();