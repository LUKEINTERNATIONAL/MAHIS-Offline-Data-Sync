// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  
  // Listen on all network interfaces
  const port_number = process.env.PORT || 3009;
  process.env.PORT = port_number.toString();
  
  // Try to detect server IP
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
    if (process.env.HOST) break;
  }
  
  await app.listen(port_number, '0.0.0.0');
  console.log(`Application is running on: http://${process.env.HOST || '0.0.0.0'}:${port_number}`);
}
bootstrap();