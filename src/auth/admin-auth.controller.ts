import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Res,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface AdminLoginDto {
  email: string;
  password: string;
}

@Controller('auth/admin')
export class AdminAuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(
    @Body() body: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, password } = body;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const admin = await this.authService.validateAdminCredentials(
      email,
      password,
    );

    const token = this.jwtService.sign({
      userId: admin.id,
      email: admin.email,
      role: admin.role,
      type: 'admin',
    });

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return {
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.cookie('admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    });

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('session')
  async session(@Request() req: any) {
    return {
      success: true,
      admin: {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role,
      },
    };
  }
}

