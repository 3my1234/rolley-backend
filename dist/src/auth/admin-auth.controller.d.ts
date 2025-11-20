import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
interface AdminLoginDto {
    email: string;
    password: string;
}
export declare class AdminAuthController {
    private readonly authService;
    private readonly jwtService;
    constructor(authService: AuthService, jwtService: JwtService);
    login(body: AdminLoginDto, res: Response): Promise<{
        success: boolean;
        token: string;
        admin: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    }>;
    logout(res: Response): Promise<{
        success: boolean;
    }>;
    session(req: any): Promise<{
        success: boolean;
        admin: {
            id: any;
            email: any;
            role: any;
        };
    }>;
}
export {};
