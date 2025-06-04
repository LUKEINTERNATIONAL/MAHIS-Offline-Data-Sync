import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConceptNameModule } from './modules/conceptName/concept-name.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('api/v1')


  const config = new DocumentBuilder()
  .setTitle('Read-Only API')
  .setDescription('GET endpoints only')
  .setVersion('1.0')
  .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [AppModule, ConceptNameModule], // can scope modules
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });

  SwaggerModule.setup('api-docs', app, document);


  /* increase JSON limit to 25 MB */
  app.use(bodyParser.json({ limit: '25mb' }));
  
  // Enable CORS - allow any origin
  app.enableCors();
  
  // Listen on all network interfaces
  const port_number = process.env.PORT || 3002;
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