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
      cwd: process.cwd()
    } as any);
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
    'https://us0soc8ooo00kks888w8owcg.useguidr.com', // Production frontend
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

  // Start USDT deposit listener (non-blocking - don't crash if it fails)
  try {
    const usdtListener = app.get(UsdtListenerService);
    usdtListener.startListening().catch((error) => {
      console.warn('⚠️  USDT listener failed to start (non-fatal):', error);
    });
  } catch (error) {
    console.warn('⚠️  Could not start USDT listener (non-fatal):', error);
  }

  // Handle unhandled errors gracefully (prevent crashes from WebSocket errors)
  process.on('unhandledRejection', (reason, promise) => {
    console.warn('⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't crash - just log the error
  });

  process.on('uncaughtException', (error) => {
    console.error('⚠️  Uncaught Exception (non-fatal):', error);
    // Don't exit - just log the error
    // Only exit on critical errors
    if (error.message?.includes('EADDRINUSE') || error.message?.includes('port')) {
      console.error('❌ Critical error: Port already in use');
      process.exit(1);
    }
  });
}

bootstrap();