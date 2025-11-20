import { Module } from '@nestjs/common';
import { DailyEventsService } from './daily-events.service';
import { DailyEventsController } from './daily-events.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule],
  providers: [DailyEventsService],
  controllers: [DailyEventsController],
  exports: [DailyEventsService],
})
export class DailyEventsModule {}
