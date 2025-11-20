"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const server_auth_1 = require("@privy-io/server-auth");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcryptjs");
let AuthService = class AuthService {
    constructor(prisma) {
        this.prisma = prisma;
        this.privyClient = new server_auth_1.PrivyClient(process.env.PRIVY_APP_ID, process.env.PRIVY_APP_SECRET);
    }
    async validatePrivyToken(token) {
        try {
            const claims = await this.privyClient.verifyAuthToken(token);
            return claims;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid Privy token');
        }
    }
    async getPrivyUser(userId) {
        try {
            const user = await this.privyClient.getUserById(userId);
            return user;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('User not found in Privy');
        }
    }
    async syncUser(privyId, referralCode) {
        const privyUser = await this.getPrivyUser(privyId);
        const email = privyUser.email?.address || null;
        const linkedWalletAccounts = Array.isArray(privyUser.linkedAccounts)
            ? privyUser.linkedAccounts.filter((account) => account?.type === 'wallet' && account?.address)
            : [];
        const privyWallets = Array.isArray(privyUser?.wallets)
            ? privyUser.wallets.filter((wallet) => wallet?.address)
            : [];
        const ethereumWallet = [...linkedWalletAccounts, ...privyWallets].find((account) => account?.chainType === 'ethereum');
        const fallbackWallet = [...linkedWalletAccounts, ...privyWallets][0];
        const walletAddress = privyUser.wallet?.address ||
            ethereumWallet?.address ||
            fallbackWallet?.address ||
            null;
        let user = await this.prisma.user.findUnique({
            where: { privyId },
        });
        if (!user) {
            let referrerId = null;
            if (referralCode) {
                const referrer = await this.prisma.user.findUnique({
                    where: { referralCode },
                });
                if (referrer) {
                    referrerId = referrer.id;
                }
            }
            const { nanoid } = await Promise.resolve().then(() => require('nanoid'));
            const newUserReferralCode = nanoid(10);
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
        }
        else {
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
    async findAdminByEmail(email) {
        if (!email) {
            throw new common_1.BadRequestException('Email is required');
        }
        return this.prisma.user.findFirst({
            where: {
                email: email.toLowerCase(),
                role: 'ADMIN',
            },
        });
    }
    async ensureAdminPassword(userId, password) {
        if (!password) {
            throw new common_1.BadRequestException('Password is required');
        }
        const hashed = await bcrypt.hash(password, 10);
        return this.prisma.user.update({
            where: { id: userId },
            data: { password: hashed },
        });
    }
    async createAdmin(email, password) {
        if (!email || !password) {
            throw new common_1.BadRequestException('Email and password are required');
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
    async validateAdminCredentials(email, password) {
        const admin = await this.findAdminByEmail(email);
        if (!admin) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!admin.password) {
            throw new common_1.UnauthorizedException('Admin password not configured');
        }
        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return admin;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map