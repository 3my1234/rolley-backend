import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AuthService } from '../auth.service';

@Injectable()
export class PrivyStrategy extends PassportStrategy(Strategy, 'privy') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: any): Promise<any> {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.substring(7);
    
    try {
      const claims = await this.authService.validatePrivyToken(token);
      return claims;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
