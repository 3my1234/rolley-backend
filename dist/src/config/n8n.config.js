"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('n8n', () => ({
    apiKey: process.env.N8N_API_KEY,
    baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
}));
//# sourceMappingURL=n8n.config.js.map