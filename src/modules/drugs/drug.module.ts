import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

import { Drug, DrugSchema } from "./schema/drug.schema";
import { DrugController } from "./drug.controller";
import { DrugService } from "./drug.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Drug.name, schema: DrugSchema }]),
  ],
  controllers: [DrugController],
  providers: [DrugService],
  //   exports: [ConceptNameService],
})
export class DrugModule {}
