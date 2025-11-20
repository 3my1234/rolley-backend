"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const usdt_listener_service_1 = require("./wallet/usdt-listener.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const frontendEnv = process.env.FRONTEND_URL || 'http://localhost:3000';
    const allowedOrigins = Array.from(new Set([
        frontendEnv,
        'http://localhost:5173',
    ]));
    app.enableCors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 Backend running on http://localhost:${port}`);
    try {
        const usdtListener = app.get(usdt_listener_service_1.UsdtListenerService);
        await usdtListener.startListening();
    }
    catch (error) {
        console.warn('⚠️  Could not start USDT listener:', error);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map