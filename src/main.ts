import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UsdtListenerService } from './wallet/usdt-listener.service';
import { execSync } from 'child_process';

async function bootstrap() {
  // Run Prisma migrations on startup (in production)
  if (process.env.NODE_ENV === 'production' || process.env.RUN_MIGRATIONS === 'true') {
    try {
      console.log('🔄 Running database migrations...');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      console.log('✅ Migrations completed');
    } catch (error) {
      console.error('❌ Migration failed, trying db push as fallback...');
      try {
        execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
        console.log('✅ Database schema synced');
      } catch (pushError) {
        console.error('❌ Database setup failed:', pushError);
        // Don't exit - let the app start and show the error
      }
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