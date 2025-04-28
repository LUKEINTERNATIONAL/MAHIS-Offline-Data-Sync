"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const bodyParser = require("body-parser");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bodyParser: false });
    app.useGlobalPipes(new common_1.ValidationPipe());
    app.use(bodyParser.json({ limit: '25mb' }));
    app.enableCors();
    const port_number = process.env.PORT || 3009;
    process.env.PORT = port_number.toString();
    const networkInterfaces = require('os').networkInterfaces();
    const addresses = [];
    for (const k in networkInterfaces) {
        for (const k2 in networkInterfaces[k]) {
            const address = networkInterfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                process.env.HOST = address.address;
                break;
            }
        }
        if (process.env.HOST)
            break;
    }
    await app.listen(port_number, '0.0.0.0');
    console.log(`Application is running on: http://${process.env.HOST || '0.0.0.0'}:${port_number}`);
}
bootstrap();
//# sourceMappingURL=main.js.map