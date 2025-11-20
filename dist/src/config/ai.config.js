"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('ai', () => ({
    geminiApiKey: process.env.GEMINI_API_KEY,
}));
//# sourceMappingURL=ai.config.js.map