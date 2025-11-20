import { Strategy } from 'passport-custom';
import { AuthService } from '../auth.service';
declare const PrivyStrategy_base: new (...args: any[]) => Strategy;
export declare class PrivyStrategy extends PrivyStrategy_base {
    private authService;
    constructor(authService: AuthService);
    validate(req: any): Promise<any>;
}
export {};
