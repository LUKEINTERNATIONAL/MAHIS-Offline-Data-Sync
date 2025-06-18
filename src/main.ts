import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import * as bodyParser from "body-parser";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConceptNameModule } from "./modules/conceptName/concept-name.module";
import { WardModule } from "./modules/wards/ward.module";
import { ConceptSetModule } from "./modules/conceptSet/concept-set.module";
import { DrugModule } from "./modules/drugs/drug.module";
import { CountryModule } from "./modules/country/country.module";
import { DiagnosisModule } from "./modules/diagnosis/diagnosis.module";
import { ProgramModule } from "./modules/programs/program.module";
import { VillageModule } from "./modules/village/village.module";
import { TestTypeModule } from "./modules/testTypes/test-type.module";
import { TestResultIndicatorModule } from "./modules/testResultIndicator/test-result-indicator.module";
import { StockModule } from "./modules/stock/stock.module";
import { RelationshipModule } from "./modules/relationship/relationship.module";
import { FacilityModule } from "./modules/facilities/facilities.module";
import { DDEModule } from "./modules/dde/dde.module";
import { VisitModule } from "./modules/visit/visit.module";
import { StageModule } from "./modules/stage/stage.module";
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  let httpsOptions = null;

  // Simple HTTPS setup - only if certificates exist
  try {
    const keyPath = path.join(process.cwd(), 'certs', 'key.pem');
    const certPath = path.join(process.cwd(), 'certs', 'cert.pem');

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
      console.log('🔒 HTTPS enabled with SSL certificates');
    } else {
      console.log('📄 No SSL certificates found, using HTTP');
    }
  } catch (error) {
    console.log('⚠️  SSL setup error, falling back to HTTP:', error.message);
  }

  const app = await NestFactory.create(AppModule, { 
    bodyParser: false,
    ...(httpsOptions && { httpsOptions })
  });

  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix("api/v1");

  const config = new DocumentBuilder()
    .setTitle("Read-Only API")
    .setDescription("GET endpoints only")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [
      AppModule,
      ConceptNameModule,
      WardModule,
      ConceptSetModule,
      DrugModule,
      CountryModule,
      DiagnosisModule,
      ProgramModule,
      VillageModule,
      TestTypeModule,
      TestResultIndicatorModule,
      StockModule,
      RelationshipModule,
      FacilityModule,
      DDEModule,
      VisitModule,
      StageModule,
    ],
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });

  SwaggerModule.setup("api-docs", app, document);

  /* increase JSON limit to 25 MB */
  app.use(bodyParser.json({ limit: "25mb" }));

  // Enable CORS - allow any origin
  app.enableCors();

  // Listen on all network interfaces
  const port_number = process.env.PORT || 3002;
  process.env.PORT = port_number.toString();

  // Try to detect server IP
  const networkInterfaces = require("os").networkInterfaces();
  const addresses = [];
  for (const k in networkInterfaces) {
    for (const k2 in networkInterfaces[k]) {
      const address = networkInterfaces[k][k2];
      if (address.family === "IPv4" && !address.internal) {
        process.env.HOST = address.address;
        break;
      }
    }
    if (process.env.HOST) break;
  }

  await app.listen(port_number, "0.0.0.0");
  
  const protocol = httpsOptions ? 'https' : 'http';
  console.log(
    `🚀 Application is running on: ${protocol}://${
      process.env.HOST || "0.0.0.0"
    }:${port_number}`
  );
  
  if (httpsOptions) {
    console.log('⚠️  Using self-signed certificate - browsers will show security warnings');
  }
}

bootstrap();