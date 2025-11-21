import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UsdtListenerService } from './wallet/usdt-listener.service';
import { execSync } from 'child_process';
import * as path from 'path';

async function bootstrap() {
  // Always run Prisma db push on startup to ensure schema is synced
  // This creates tables automatically from the Prisma schema
  try {
    console.log('🔄 Syncing database schema...');
    const prismaPath = path.join(process.cwd(), 'node_modules', '.bin', 'prisma');
    const command = `node "${prismaPath}" db push --skip-generate --accept-data-loss`;
    console.log(`Running: ${command}`);
    execSync(command, { 
      stdio: 'inherit', 
      env: { ...process.env },
      cwd: process.cwd(),
      shell: true
    });
    console.log('✅ Database schema synced successfully');
  } catch (error) {
    console.error('❌ Database schema sync failed:', error);
    console.error('⚠️  Continuing anyway - app may fail if tables are missing');
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