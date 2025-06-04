import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { Drug, DrugSchema } from "./schema/drug.schema";
import { DrugController } from "./drug.controller";
import { DrugService } from "./drug.service";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Drug.name, schema: DrugSchema }]),
    HttpModule
  ],
  controllers: [DrugController],
  providers: [DrugService],
  exports: [DrugService],
})
export class DrugModule {}
