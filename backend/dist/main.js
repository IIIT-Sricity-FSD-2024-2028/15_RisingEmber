"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        cors: {
            origin: true,
            credentials: false,
        },
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const port = Number(process.env.PORT || 3000);
    const host = process.env.HOST || '127.0.0.1';
    await app.listen(port, host);
    // eslint-disable-next-line no-console
    console.log(`ServiceHub backend running on http://${host}:${port}/api/v1`);
}
bootstrap();
//# sourceMappingURL=main.js.map