import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import * as bodyParser from "body-parser";
import * as fs from "fs";
import * as path from "path";
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

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, "..", "ssl", "server.key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "..", "ssl", "server.cert.pem")),
  };

  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    httpsOptions,
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
    ],
    operationIdFactory: (controllerKey: string, methodKey: string) =>
      `${controllerKey}_${methodKey}`,
  });

  SwaggerModule.setup("api-docs", app, document);
  app.use(bodyParser.json({ limit: "25mb" }));
  app.enableCors();

  const port_number = process.env.PORT || 3002;
  process.env.PORT = port_number.toString();

  const networkInterfaces = require("os").networkInterfaces();
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
  console.log(
    `🚀 Application is running on: https://${
      process.env.HOST || "0.0.0.0"
    }:${port_number}`
  );
}
bootstrap();
