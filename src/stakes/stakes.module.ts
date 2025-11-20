import { Module } from '@nestjs/common';
import { StakesService } from './stakes.service';
import { StakesController } from './stakes.controller';
import { UsersModule } from '../users/users.module';
import { TokensModule } from '../tokens/tokens.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsersModule, TokensModule, PrismaModule, AuthModule],
  providers: [StakesService],
  controllers: [StakesController],
  exports: [StakesService],
})
export class StakesModule {}
