import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrivyClient } from '@privy-io/server-auth';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private privyClient: PrivyClient;

  constructor(private prisma: PrismaService) {
    this.privyClient = new PrivyClient(
      process.env.PRIVY_APP_ID,
      process.env.PRIVY_APP_SECRET,
    );
  }

  async validatePrivyToken(token: string) {
    try {
      const claims = await this.privyClient.verifyAuthToken(token);
      return claims;
    } catch (error) {
      throw new UnauthorizedException('Invalid Privy token');
    }
  }

  async getPrivyUser(userId: string) {
    try {
      const user = await this.privyClient.getUserById(userId);
      return user;
    } catch (error) {
      throw new UnauthorizedException('User not found in Privy');
    }
  }

  async syncUser(privyId: string, referralCode?: string) {
    const privyUser = await this.getPrivyUser(privyId);
    
    const email = privyUser.email?.address || null;

    type PrivyLinkedWallet = {
      type?: string;
      chainType?: string;
      address?: string;
    };

    const linkedWalletAccounts: PrivyLinkedWallet[] = Array.isArray(privyUser.linkedAccounts)
      ? (privyUser.linkedAccounts as unknown as PrivyLinkedWallet[]).filter(
          (account) => account?.type === 'wallet' && account?.address,
        )
      : [];

    const privyWallets: PrivyLinkedWallet[] = Array.isArray((privyUser as any)?.wallets)
      ? (((privyUser as any).wallets as unknown) as PrivyLinkedWallet[]).filter(
          (wallet) => wallet?.address,
        )
      : [];

    const ethereumWallet = [...linkedWalletAccounts, ...privyWallets].find(
      (account) => account?.chainType === 'ethereum',
    );

    const fallbackWallet = [...linkedWalletAccounts, ...privyWallets][0];

    const walletAddress =
      privyUser.wallet?.address ||
      ethereumWallet?.address ||
      fallbackWallet?.address ||
      null;

    // Check if user exists
    let user = await this.prisma.user.findUnique({
      where: { privyId },
    });

    if (!user) {
      // Find referrer by code (if provided)
      let referrerId = null;
      if (referralCode) {
        const referrer = await this.prisma.user.findUnique({
          where: { referralCode },
        });
        if (referrer) {
          referrerId = referrer.id;
        }
      }

      // Generate unique referral code for new user
      const { nanoid } = await import('nanoid');
      const newUserReferralCode = nanoid(10);

      // Create new user
      user = await this.prisma.user.create({
        data: {
          privyId,
          email,
          walletAddress,
          role: 'USER',
          usdBalance: 0,
          usdtBalance: 0,
          firstName: null,
          lastName: null,
          phoneNumber: null,
          referralCode: newUserReferralCode,
          referredBy: referrerId,
        },
      });
    } else {
      // Update existing user
      user = await this.prisma.user.update({
        where: { privyId },
        data: {
          email: email || user.email,
          walletAddress: walletAddress || user.walletAddress,
        },
      });
    }

    return user;
  }

  async findAdminByEmail(email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    return this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        role: 'ADMIN',
      },
    });
  }

  async ensureAdminPassword(userId: string, password: string) {
    if (!password) {
      throw new BadRequestException('Password is required');
    }

    const hashed = await bcrypt.hash(password, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
  }

  async createAdmin(email: string, password: string) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const hashed = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashed,
        role: 'ADMIN',
      },
    });
  }

  async validateAdminCredentials(email: string, password: string) {
    const admin = await this.findAdminByEmail(email);

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!admin.password) {
      throw new UnauthorizedException('Admin password not configured');
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return admin;
  }
}