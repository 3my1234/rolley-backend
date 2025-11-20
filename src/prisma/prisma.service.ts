import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Debug: Log connection details (mask password for security)
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
      this.logger.log(`Connecting to database: ${maskedUrl}`);
    } else {
      this.logger.error('DATABASE_URL environment variable is not set!');
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    await this.$connect();
    this.logger.log('Successfully connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
