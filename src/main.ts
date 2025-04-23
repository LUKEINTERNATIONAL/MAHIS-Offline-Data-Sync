import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  
  // Listen on all network interfaces
  const port_number = process.env.PORT || 3009;
  await app.listen(port_number, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port_number}`);
}
bootstrap();