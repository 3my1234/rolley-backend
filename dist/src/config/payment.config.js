"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('payment', () => ({
    flutterwavePublicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
    flutterwaveSecretKey: process.env.FLUTTERWAVE_SECRET_KEY,
    flutterwaveEncryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
}));
//# sourceMappingURL=payment.config.js.map