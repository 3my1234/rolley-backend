import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByPrivyId(privyId: string) {
    const user = await this.prisma.user.findUnique({
      where: { privyId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByReferralCode(referralCode: string) {
    return this.prisma.user.findUnique({
      where: { referralCode },
    });
  }

  async update(id: string, data: any) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        Array.isArray(error.meta?.target) &&
        error.meta?.target.includes('email')
      ) {
        throw new BadRequestException('Email address already in use. Please choose another.');
      }
      throw error;
    }
  }

  async updateBalance(id: string, currency: 'USD' | 'USDT', amount: number) {
    const field = currency === 'USD' ? 'usdBalance' : 'usdtBalance';
    
    return this.prisma.user.update({
      where: { id },
      data: {
        [field]: {
          increment: amount,
        },
      },
    });
  }

  async getReferralStats(userId: string) {
    const referrals = await this.prisma.user.count({
      where: { referredBy: userId },
    });

    return {
      totalReferrals: referrals,
    };
  }
}