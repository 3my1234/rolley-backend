"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('api', () => ({
    footballKey: process.env.API_FOOTBALL_KEY,
}));
//# sourceMappingURL=api.config.js.map