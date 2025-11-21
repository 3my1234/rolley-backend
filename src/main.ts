import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UsdtListenerService } from './wallet/usdt-listener.service';
import { execSync } from 'child_process';

async function bootstrap() {
  // Run Prisma db push on startup to ensure schema is synced (in production)
  // This is safer than migrations for initial setup
  if (process.env.NODE_ENV === 'production' || process.env.RUN_MIGRATIONS === 'true') {
    try {
      console.log('🔄 Syncing database schema...');
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit', env: process.env });
      console.log('✅ Database schema synced');
    } catch (error) {
      console.error('❌ Database schema sync failed:', error);
      // Continue anyway - might be a transient error
    }
  }

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